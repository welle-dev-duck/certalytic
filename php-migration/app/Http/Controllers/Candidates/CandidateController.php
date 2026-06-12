<?php

namespace App\Http\Controllers\Candidates;

use App\Actions\Candidates\RerunCandidateScreening;
use App\Actions\Candidates\StartCandidateScreening;
use App\Enums\CandidateStatus;
use App\Http\Controllers\Controller;
use App\Http\Controllers\Roles\RoleController;
use App\Http\Requests\Candidates\StoreCandidateRequest;
use App\Models\Candidate;
use App\Models\Role;
use App\Models\Team;
use App\Services\CandidateReport;
use App\Services\PlanFeatures;
use App\Services\ScreeningReportPdfExporter;
use App\Services\Storage\SignedStorageUrlService;
use App\Services\TokenService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as HttpResponse;

class CandidateController extends Controller
{
    private const PAGE_SIZES = [10, 25, 50, 100];

    public function index(Request $request, Team $current_team): Response
    {
        Gate::authorize('viewAny', Candidate::class);

        $planFeatures = app(PlanFeatures::class);
        $tokenService = app(TokenService::class);
        $selectedRoleId = $request->integer('role_id') ?: null;
        $search = trim((string) $request->string('search'));
        $status = $this->resolveStatusFilter($request);
        $perPage = $this->resolvePerPage($request);

        $candidatesQuery = $current_team->candidates()
            ->with('jobRole')
            ->withCount('interviewRounds')
            ->latest();

        if ($selectedRoleId !== null) {
            $candidatesQuery->where('role_id', $selectedRoleId);
        }

        if ($status !== null) {
            $candidatesQuery->where('status', $status);
        }

        if ($search !== '') {
            $term = '%'.mb_strtolower($search).'%';

            $candidatesQuery->where(function ($query) use ($term): void {
                $query
                    ->whereRaw('LOWER(name) LIKE ?', [$term])
                    ->orWhereRaw('LOWER(email) LIKE ?', [$term])
                    ->orWhereRaw('LOWER(role) LIKE ?', [$term]);
            });
        }

        $candidates = $candidatesQuery
            ->paginate($perPage)
            ->withQueryString()
            ->through(fn (Candidate $candidate) => $this->transformCandidate($candidate));

        $savedRoles = $planFeatures->can($current_team, 'saved_roles')
            ? $current_team->roles()->orderBy('title')->get()->map(fn (Role $role) => RoleController::transformRole($role))
            : collect();

        return Inertia::render('screenings/index', [
            'candidates' => $candidates,
            'filters' => [
                'search' => $search,
                'role_id' => $selectedRoleId,
                'status' => $status?->value,
                'per_page' => $perPage,
            ],
            'pageSizes' => self::PAGE_SIZES,
            'statuses' => array_map(fn (CandidateStatus $case) => $case->value, CandidateStatus::cases()),
            'tokenUsage' => $tokenService->usageSummary($current_team),
            'canCrossSource' => $planFeatures->can($current_team, 'cross_source'),
            'canCrossSourceManual' => $planFeatures->can($current_team, 'cross_source_manual'),
            'canSavedRoles' => $planFeatures->can($current_team, 'saved_roles'),
            'savedRoles' => $savedRoles,
            'selectedRoleId' => $selectedRoleId,
        ]);
    }

    public function create(Team $current_team): RedirectResponse
    {
        Gate::authorize('create', Candidate::class);

        return redirect()->route('candidates.index', [
            'current_team' => $current_team,
            'screen' => '1',
        ]);
    }

    public function store(
        StoreCandidateRequest $request,
        Team $current_team,
        StartCandidateScreening $startCandidateScreening,
    ): RedirectResponse {
        Gate::authorize('create', Candidate::class);

        $candidate = $startCandidateScreening->handle($current_team, $request->toDto());

        return redirect()->route('candidates.show', [$current_team, $candidate]);
    }

    public function show(Team $current_team, Candidate $candidate): Response
    {
        Gate::authorize('view', $candidate);

        $candidate->load('interviewRounds');

        $planFeatures = app(PlanFeatures::class);

        return Inertia::render('screenings/show', [
            'candidate' => $this->transformCandidate($candidate, includeBreakdown: true),
            'report' => CandidateReport::build($candidate),
            'showFullBreakdown' => $planFeatures->can($current_team, 'full_breakdown'),
        ]);
    }

    public function rerun(
        Team $current_team,
        Candidate $candidate,
        RerunCandidateScreening $rerunCandidateScreening,
    ): RedirectResponse {
        Gate::authorize('update', $candidate);

        try {
            $rerunCandidateScreening->handle($current_team, $candidate);
        } catch (\RuntimeException $exception) {
            return redirect()
                ->back()
                ->withErrors(['rerun' => $exception->getMessage()]);
        }

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('Screening re-queued for analysis.'),
        ]);

        return redirect()->route('candidates.show', [$current_team, $candidate]);
    }

    public function export(
        Team $current_team,
        Candidate $candidate,
        ScreeningReportPdfExporter $exporter,
    ): HttpResponse {
        Gate::authorize('view', $candidate);

        abort_unless($candidate->team_id === $current_team->id, 404);
        abort_unless($candidate->status === CandidateStatus::Complete, 422);

        return $exporter->download($candidate);
    }

    public function cv(
        Team $current_team,
        Candidate $candidate,
        SignedStorageUrlService $signedStorageUrlService,
    ): RedirectResponse {
        Gate::authorize('view', $candidate);

        abort_unless($candidate->team_id === $current_team->id, 404);

        $signedUrl = $signedStorageUrlService->temporaryUrl($candidate->cv_path);

        abort_unless($signedUrl !== null, 404);

        return redirect()->away($signedUrl);
    }

    public function destroy(Team $current_team, Candidate $candidate, SignedStorageUrlService $signedStorageUrlService): RedirectResponse
    {
        Gate::authorize('delete', $candidate);

        if ($candidate->cv_path) {
            $signedStorageUrlService->delete($candidate->cv_path);
        }

        $candidate->delete();

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('Candidate deleted.'),
        ]);

        return redirect()->back(fallback: route('candidates.index', $current_team));
    }

    private function resolvePerPage(Request $request): int
    {
        $perPage = (int) $request->integer('per_page', self::PAGE_SIZES[0]);

        return in_array($perPage, self::PAGE_SIZES, true) ? $perPage : self::PAGE_SIZES[0];
    }

    private function resolveStatusFilter(Request $request): ?CandidateStatus
    {
        return CandidateStatus::tryFrom((string) $request->string('status'));
    }

    /**
     * @return array<string, mixed>
     */
    private function transformCandidate(Candidate $candidate, bool $includeBreakdown = false): array
    {
        $data = [
            'id' => $candidate->id,
            'name' => $candidate->name,
            'email' => $candidate->email,
            'role' => $candidate->role,
            'role_id' => $candidate->role_id,
            'job_role_title' => $candidate->jobRole?->title,
            'status' => $candidate->status->value,
            'integrity_score' => $candidate->integrity_score,
            'rounds_count' => (int) ($candidate->interview_rounds_count ?? $candidate->interviewRounds()->count()),
            'high_inconsistency_warning' => $candidate->high_inconsistency_warning,
            'processed_at' => $candidate->processed_at,
            'error_message' => $candidate->error_message,
            'linkedin_url' => $candidate->linkedin_url,
            'github_username' => $candidate->github_username,
            'rounds' => $candidate->relationLoaded('interviewRounds')
                ? $candidate->interviewRounds->map(fn ($round) => [
                    'id' => $round->id,
                    'round_number' => $round->round_number,
                    'was_truncated' => $round->was_truncated,
                    'variance_delta' => $round->variance_delta,
                    'round_scores' => $round->round_scores,
                    'deep_dive_prompts' => $round->deep_dive_prompts,
                ])->values()->all()
                : [],
        ];

        if ($includeBreakdown) {
            $data['score_breakdown'] = $candidate->score_breakdown;
            $data['follow_up_suggested'] = $candidate->follow_up_suggested;
        }

        return $data;
    }
}
