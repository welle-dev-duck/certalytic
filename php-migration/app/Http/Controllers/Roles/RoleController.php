<?php

namespace App\Http\Controllers\Roles;

use App\Actions\Roles\CreateRole;
use App\Actions\Roles\UpdateRole;
use App\Enums\CandidateStatus;
use App\Enums\RoleExportStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Roles\StoreRoleDocumentRequest;
use App\Http\Requests\Roles\StoreRoleRequest;
use App\Http\Requests\Roles\UpdateRoleRequest;
use App\Jobs\GenerateRoleExportPdfJob;
use App\Jobs\ProcessRoleDocumentJob;
use App\Models\Candidate;
use App\Models\Role;
use App\Models\RoleDocument;
use App\Models\RoleExport;
use App\Models\Team;
use App\Services\PlanFeatures;
use App\Services\Storage\SignedStorageUrlService;
use App\Services\Storage\StoragePathBuilder;
use App\Services\TokenService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as HttpResponse;

class RoleController extends Controller
{
    private const PAGE_SIZES = [10, 25, 50, 100];

    public function index(Request $request, Team $current_team, PlanFeatures $planFeatures): Response
    {
        Gate::authorize('viewAny', Role::class);

        $search = trim((string) $request->string('search'));
        $perPage = $this->resolvePerPage($request);

        $rolesQuery = $current_team->roles()
            ->withCount('candidates')
            ->withAvg('candidates as avg_integrity', 'integrity_score')
            ->latest();

        if ($search !== '') {
            $term = '%'.mb_strtolower($search).'%';

            $rolesQuery->whereRaw('LOWER(title) LIKE ?', [$term]);
        }

        $roles = $rolesQuery
            ->paginate($perPage)
            ->withQueryString()
            ->through(fn (Role $role) => $this->transformRoleListItem($role));

        return Inertia::render('roles/index', [
            'roles' => $roles,
            'filters' => [
                'search' => $search,
                'per_page' => $perPage,
            ],
            'pageSizes' => self::PAGE_SIZES,
        ]);
    }

    private function resolvePerPage(Request $request): int
    {
        $perPage = (int) $request->integer('per_page', self::PAGE_SIZES[0]);

        return in_array($perPage, self::PAGE_SIZES, true) ? $perPage : self::PAGE_SIZES[0];
    }

    public function show(Request $request, Team $current_team, Role $role, PlanFeatures $planFeatures, TokenService $tokenService): Response
    {
        Gate::authorize('view', $role);

        abort_unless($role->team_id === $current_team->id, 404);

        $role->loadCount('candidates')
            ->loadAvg('candidates as avg_integrity', 'integrity_score')
            ->load('documents');

        $perPage = $this->resolvePerPage($request);
        $search = trim((string) $request->string('search'));

        $candidatesQuery = $role->candidates()
            ->withCount('interviewRounds')
            ->latest();

        if ($search !== '') {
            $term = '%'.mb_strtolower($search).'%';

            $candidatesQuery->where(function ($query) use ($term): void {
                $query
                    ->whereRaw('LOWER(name) LIKE ?', [$term])
                    ->orWhereRaw('LOWER(email) LIKE ?', [$term]);
            });
        }

        $candidates = $candidatesQuery
            ->paginate($perPage)
            ->withQueryString()
            ->through(fn (Candidate $candidate) => $this->transformRoleCandidate($candidate));

        $scoredQuery = $role->candidates()
            ->where('status', CandidateStatus::Complete)
            ->whereNotNull('integrity_score');

        $distribution = [
            'high' => (clone $scoredQuery)->where('integrity_score', '>=', 75)->count(),
            'medium' => (clone $scoredQuery)->whereBetween('integrity_score', [50, 74.99])->count(),
            'low' => (clone $scoredQuery)->where('integrity_score', '<', 50)->count(),
        ];

        return Inertia::render('roles/show', [
            'role' => self::transformRole($role),
            'candidates' => $candidates,
            'stats' => [
                'avg_integrity' => $role->avg_integrity !== null ? round((float) $role->avg_integrity) : null,
                'scored' => array_sum($distribution),
                'distribution' => $distribution,
            ],
            'pageSizes' => self::PAGE_SIZES,
            'filters' => [
                'search' => $search,
                'per_page' => $perPage,
            ],
            'canUploadDocuments' => $planFeatures->can($current_team, 'role_context_assets'),
            'maxDocuments' => $planFeatures->maxRoleDocuments($current_team),
            'tokenUsage' => $tokenService->usageSummary($current_team),
            'canCrossSource' => $planFeatures->can($current_team, 'cross_source'),
            'canCrossSourceManual' => $planFeatures->can($current_team, 'cross_source_manual'),
            'latestExport' => $this->transformLatestExport($role, $current_team),
        ]);
    }

    public function requestExport(Team $current_team, Role $role): RedirectResponse
    {
        Gate::authorize('view', $role);

        abort_unless($role->team_id === $current_team->id, 404);

        $inProgress = RoleExport::query()
            ->where('role_id', $role->id)
            ->whereIn('status', [RoleExportStatus::Pending, RoleExportStatus::Processing])
            ->exists();

        if ($inProgress) {
            return back()->withErrors([
                'export' => 'A role dossier export is already in progress.',
            ]);
        }

        $export = RoleExport::query()->create([
            'team_id' => $current_team->id,
            'role_id' => $role->id,
            'user_id' => auth()->id(),
            'status' => RoleExportStatus::Pending,
        ]);

        GenerateRoleExportPdfJob::dispatch($export);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Role dossier export queued. Your download will start when it is ready.',
        ]);
        Inertia::flash('exportQueued', true);

        return redirect()->route('roles.show', [$current_team, $role]);
    }

    public function downloadExport(Team $current_team, Role $role, RoleExport $roleExport): HttpResponse
    {
        Gate::authorize('view', $role);

        abort_unless(
            $role->team_id === $current_team->id
            && $roleExport->role_id === $role->id
            && $roleExport->team_id === $current_team->id,
            404,
        );

        abort_unless($roleExport->status === RoleExportStatus::Complete, 422);
        abort_unless($roleExport->path !== null, 404);

        $storage = app(SignedStorageUrlService::class);
        $contents = $storage->get($roleExport->path);

        abort_unless($contents !== null, 404);

        $filename = Str::slug($role->title).'-role-dossier.pdf';

        return response($contents, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="'.$filename.'"',
        ]);
    }

    public function store(StoreRoleRequest $request, Team $current_team, CreateRole $createRole): RedirectResponse
    {
        Gate::authorize('create', Role::class);

        $role = $createRole->handle(
            $current_team,
            $request->validated('title'),
            $request->validated('description'),
        );

        return redirect()->route('roles.show', [$current_team, $role]);
    }

    public function update(UpdateRoleRequest $request, Team $current_team, Role $role, UpdateRole $updateRole): RedirectResponse
    {
        Gate::authorize('update', $role);

        abort_unless($role->team_id === $current_team->id, 404);

        $updateRole->handle(
            $role,
            $request->validated('title'),
            $request->validated('description'),
        );

        return redirect()->route('roles.show', [$current_team, $role]);
    }

    public function destroy(Team $current_team, Role $role): RedirectResponse
    {
        Gate::authorize('delete', $role);

        abort_unless($role->team_id === $current_team->id, 404);

        $role->load('documents');

        foreach ($role->documents as $document) {
            Storage::delete($document->path);
        }

        $role->delete();

        return redirect()->route('roles.index', $current_team);
    }

    public function storeDocument(StoreRoleDocumentRequest $request, Team $current_team, Role $role): RedirectResponse
    {
        Gate::authorize('uploadDocument', $role);

        abort_unless($role->team_id === $current_team->id, 404);

        $file = $request->file('document');
        $pathBuilder = app(StoragePathBuilder::class);
        $storage = app(SignedStorageUrlService::class);
        $path = $pathBuilder->roleDocument($role->id, $file->getClientOriginalExtension());
        $storage->put($path, $file->get());

        $document = $role->documents()->create([
            'original_name' => $request->file('document')->getClientOriginalName(),
            'path' => $path,
            'sort_order' => $role->documents()->count(),
        ]);

        ProcessRoleDocumentJob::dispatch($document);

        return redirect()->route('roles.show', [$current_team, $role]);
    }

    public function destroyDocument(Team $current_team, Role $role, RoleDocument $document): RedirectResponse
    {
        Gate::authorize('uploadDocument', $role);

        abort_unless($role->team_id === $current_team->id && $document->role_id === $role->id, 404);

        Storage::delete($document->path);
        $document->delete();

        return redirect()->route('roles.show', [$current_team, $role]);
    }

    /**
     * @return array<string, mixed>
     */
    public static function transformRoleListItem(Role $role): array
    {
        return [
            'id' => $role->id,
            'title' => $role->title,
            'description' => $role->description,
            'context_metadata' => $role->context_metadata,
            'candidates_count' => $role->candidates_count ?? $role->candidates()->count(),
            'avg_integrity' => isset($role->avg_integrity) ? round((float) $role->avg_integrity) : null,
            'created_at' => $role->created_at,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public static function transformRole(Role $role): array
    {
        return [
            'id' => $role->id,
            'title' => $role->title,
            'description' => $role->description,
            'context_metadata' => $role->context_metadata,
            'candidates_count' => $role->candidates_count ?? $role->candidates()->count(),
            'documents' => $role->relationLoaded('documents')
                ? $role->documents->map(fn (RoleDocument $document) => [
                    'id' => $document->id,
                    'original_name' => $document->original_name,
                    'ocr_status' => $document->ocr_status->value,
                ])->values()->all()
                : [],
            'created_at' => $role->created_at,
        ];
    }

    /**
     * @return array<string, mixed>|null
     */
    private function transformLatestExport(Role $role, Team $team): ?array
    {
        $export = $role->exports()->first();

        if ($export === null) {
            return null;
        }

        return [
            'id' => $export->id,
            'status' => $export->status->value,
            'error_message' => $export->error_message,
            'completed_at' => $export->completed_at,
            'download_url' => $export->status === RoleExportStatus::Complete
                ? route('roles.exports.download', [$team, $role, $export])
                : null,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function transformRoleCandidate(Candidate $candidate): array
    {
        return [
            'id' => $candidate->id,
            'name' => $candidate->name,
            'email' => $candidate->email,
            'status' => $candidate->status->value,
            'integrity_score' => $candidate->integrity_score,
            'rounds_count' => (int) ($candidate->interview_rounds_count ?? 0),
            'processed_at' => $candidate->processed_at,
        ];
    }
}
