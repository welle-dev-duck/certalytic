<?php

namespace App\Services;

use App\Enums\CandidateStatus;
use App\Models\Role;
use App\Models\RoleExport;
use App\Services\Storage\SignedStorageUrlService;
use App\Services\Storage\StoragePathBuilder;
use Barryvdh\DomPDF\Facade\Pdf;

class RoleExportPdfGenerator
{
    public function __construct(
        private PlanFeatures $planFeatures,
        private PdfWatermarkApplier $watermarkApplier,
        private SignedStorageUrlService $storage,
        private StoragePathBuilder $pathBuilder,
    ) {}

    public function store(Role $role, RoleExport $export): string
    {
        $role->loadMissing('team');

        $team = $role->team;
        $watermarked = $this->planFeatures->can($team, 'watermarked_exports');
        $showFullBreakdown = $this->planFeatures->can($team, 'full_breakdown');

        $candidates = $role->candidates()
            ->where('status', CandidateStatus::Complete)
            ->with('interviewRounds')
            ->orderByDesc('integrity_score')
            ->orderBy('name')
            ->get();

        $scoredQuery = $role->candidates()
            ->where('status', CandidateStatus::Complete)
            ->whereNotNull('integrity_score');

        $distribution = [
            'high' => (clone $scoredQuery)->where('integrity_score', '>=', 75)->count(),
            'medium' => (clone $scoredQuery)->whereBetween('integrity_score', [50, 74.99])->count(),
            'low' => (clone $scoredQuery)->where('integrity_score', '<', 50)->count(),
        ];

        $candidateReports = $candidates->map(fn ($candidate) => [
            'candidate' => $candidate,
            'report' => CandidateReport::build($candidate),
        ])->all();

        $pdf = Pdf::loadView('pdf.role-export', [
            'role' => $role,
            'candidateReports' => $candidateReports,
            'stats' => [
                'avg_integrity' => $role->candidates()
                    ->where('status', CandidateStatus::Complete)
                    ->whereNotNull('integrity_score')
                    ->avg('integrity_score'),
                'scored' => array_sum($distribution),
                'distribution' => $distribution,
                'total_candidates' => $role->candidates()->count(),
                'completed_candidates' => $candidates->count(),
            ],
            'showFullBreakdown' => $showFullBreakdown,
            'generatedAt' => now(),
        ])->setPaper('a4');

        $this->watermarkApplier->apply($pdf, $watermarked);

        $path = $this->pathBuilder->roleExport($team->id, $role->id, $export->id);
        $this->storage->put($path, $pdf->output());

        return $path;
    }
}
