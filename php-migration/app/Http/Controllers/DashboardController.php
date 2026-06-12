<?php

namespace App\Http\Controllers;

use App\Enums\CandidateStatus;
use App\Http\Controllers\Roles\RoleController;
use App\Models\Candidate;
use App\Models\Role;
use App\Models\Team;
use App\Services\CandidateReport;
use App\Services\PlanFeatures;
use App\Services\TokenService;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    private const PAGE_SIZES = [5, 10, 25];

    public function __invoke(Request $request, Team $current_team, TokenService $tokenService, PlanFeatures $planFeatures): Response
    {
        $user = $request->user();
        $firstName = trim(explode(' ', (string) $user?->name, 2)[0] ?? '') ?: 'there';

        $roles = $planFeatures->can($current_team, 'saved_roles')
            ? $current_team->roles()
                ->withCount('candidates')
                ->orderBy('title')
                ->get()
                ->map(fn (Role $role) => RoleController::transformRole($role))
            : collect();

        $selectedRoleId = $request->integer('role_id') ?: null;
        $search = trim((string) $request->string('search'));
        $perPage = $this->resolvePerPage($request);

        $recentScreeningsQuery = $current_team->candidates()
            ->with('interviewRounds')
            ->latest();

        if ($search !== '') {
            $term = '%'.mb_strtolower($search).'%';
            $recentScreeningsQuery->whereRaw('LOWER(name) LIKE ?', [$term]);
        }

        $recentScreenings = $recentScreeningsQuery
            ->paginate($perPage)
            ->withQueryString()
            ->through(fn (Candidate $candidate) => [
                'id' => $candidate->id,
                'name' => $candidate->name,
                'role' => $candidate->role,
                'role_id' => $candidate->role_id,
                'status' => $candidate->status->value,
                'integrity_score' => $candidate->integrity_score,
                'flags' => CandidateReport::flags($candidate),
                'created_at' => $candidate->created_at?->toIso8601String(),
                'processed_at' => $candidate->processed_at?->toIso8601String(),
            ]);

        return Inertia::render('dashboard', [
            'firstName' => $firstName,
            'recentScreenings' => $recentScreenings,
            'filters' => [
                'search' => $search,
                'per_page' => $perPage,
            ],
            'pageSizes' => self::PAGE_SIZES,
            'stats' => $this->stats($current_team),
            'riskDistribution' => $this->riskDistribution($current_team),
            'trend' => $this->trend($current_team),
            'tokenUsage' => $tokenService->usageSummary($current_team),
            'roles' => $roles,
            'selectedRoleId' => $selectedRoleId,
            'canSavedRoles' => $planFeatures->can($current_team, 'saved_roles'),
            'canCrossSource' => $planFeatures->can($current_team, 'cross_source'),
            'canCrossSourceManual' => $planFeatures->can($current_team, 'cross_source_manual'),
        ]);
    }

    private function resolvePerPage(Request $request): int
    {
        $perPage = $request->integer('per_page');

        return in_array($perPage, self::PAGE_SIZES, true) ? $perPage : 10;
    }

    /**
     * @return array<string, int|float|null>
     */
    private function stats(Team $current_team): array
    {
        $scored = $current_team->candidates()
            ->where('status', CandidateStatus::Complete)
            ->whereNotNull('integrity_score');

        return [
            'total' => $current_team->candidates()->count(),
            'scored' => (clone $scored)->count(),
            'flagged' => (clone $scored)->where('integrity_score', '<', 50)->count(),
            'avg_integrity' => (clone $scored)->avg('integrity_score') !== null
                ? round((float) (clone $scored)->avg('integrity_score'))
                : null,
        ];
    }

    /**
     * @return list<array{name: string, value: int, color: string}>
     */
    private function riskDistribution(Team $current_team): array
    {
        $scored = $current_team->candidates()
            ->where('status', CandidateStatus::Complete)
            ->whereNotNull('integrity_score');

        return [
            [
                'name' => 'High Integrity',
                'value' => (clone $scored)->where('integrity_score', '>=', 75)->count(),
                'color' => '#10B981',
            ],
            [
                'name' => 'Suspicious',
                'value' => (clone $scored)
                    ->where('integrity_score', '>=', 50)
                    ->where('integrity_score', '<', 75)
                    ->count(),
                'color' => '#F59E0B',
            ],
            [
                'name' => 'Low Integrity',
                'value' => (clone $scored)->where('integrity_score', '<', 50)->count(),
                'color' => '#EF4444',
            ],
        ];
    }

    /**
     * 14-day rolling series of average integrity score and flagged count.
     *
     * @return list<array{date: string, avgScore: int|null, flagged: int}>
     */
    private function trend(Team $current_team): array
    {
        $start = Carbon::today()->subDays(13);

        $rows = $current_team->candidates()
            ->where('status', CandidateStatus::Complete)
            ->whereNotNull('integrity_score')
            ->whereNotNull('processed_at')
            ->where('processed_at', '>=', $start)
            ->get(['integrity_score', 'processed_at'])
            ->groupBy(fn (Candidate $candidate) => $candidate->processed_at->toDateString());

        return collect(range(13, 0))
            ->map(function (int $offset) use ($rows): array {
                $day = Carbon::today()->subDays($offset);
                $bucket = $rows->get($day->toDateString());

                return [
                    'date' => $day->format('M j'),
                    'avgScore' => $bucket
                        ? (int) round($bucket->avg('integrity_score'))
                        : null,
                    'flagged' => $bucket
                        ? $bucket->filter(fn (Candidate $candidate) => (float) $candidate->integrity_score < 50)->count()
                        : 0,
                ];
            })
            ->all();
    }
}
