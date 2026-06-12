<?php

namespace App\Services;

use App\Enums\CandidateStatus;
use App\Models\Candidate;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Str;
use RuntimeException;
use Symfony\Component\HttpFoundation\Response;

class ScreeningReportPdfExporter
{
    public function __construct(
        private PlanFeatures $planFeatures,
        private PdfWatermarkApplier $watermarkApplier,
    ) {}

    public function download(Candidate $candidate): Response
    {
        if ($candidate->status !== CandidateStatus::Complete) {
            throw new RuntimeException('Integrity report is available only for completed screenings.');
        }

        $candidate->loadMissing(['team', 'jobRole', 'interviewRounds']);

        $team = $candidate->team;
        $watermarked = $this->planFeatures->can($team, 'watermarked_exports');

        $pdf = Pdf::loadView('pdf.screening-report', [
            'candidate' => $candidate,
            'report' => CandidateReport::build($candidate),
            'showFullBreakdown' => $this->planFeatures->can($team, 'full_breakdown'),
            'generatedAt' => now(),
        ])->setPaper('a4');

        $this->watermarkApplier->apply($pdf, $watermarked);

        $filename = Str::slug($candidate->name).'-integrity-dossier.pdf';

        return $pdf->download($filename);
    }
}
