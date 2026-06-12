import { Head, Link, router, usePage } from '@inertiajs/react';
import { ChevronRight, Plus, Search } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import CandidateRowActions from '@/components/candidates/candidate-row-actions';
import DeleteCandidateDialog from '@/components/candidates/delete-candidate-dialog';
import RerunCandidateDialog from '@/components/candidates/rerun-candidate-dialog';
import StartCandidateScreeningModal from '@/components/candidates/start-screening-modal';
import { ScoreRing } from '@/components/certalytic/score-ring';
import { IntegrityBadge, StatusBadge } from '@/components/certalytic/status-badge';
import TablePagination from '@/components/certalytic/table-pagination';
import RoleCombobox from '@/components/roles/role-combobox';
import { Button } from '@/components/ui/button';
import { getIntegrityLevel } from '@/lib/integrity';
import { dashboard as dashboardRoute } from '@/routes';
import { show as roleShow } from '@/routes/roles';
import { index as screeningsIndex, show as screeningShow } from '@/routes/candidates';
import type { Candidate, TokenUsage } from '@/types/candidates';
import type { Paginated } from '@/types/pagination';
import type { JobRole } from '@/types/roles';

type Props = {
    candidates: Paginated<Candidate>;
    filters: {
        search: string;
        role_id: number | null;
        status: string | null;
        per_page: number;
    };
    pageSizes: number[];
    statuses: string[];
    savedRoles: JobRole[];
    canCrossSource: boolean;
    canCrossSourceManual: boolean;
    tokenUsage: TokenUsage;
};

function toScore(value: string | number | null): number | null {
    if (value === null) {
        return null;
    }

    const parsed = typeof value === 'string' ? parseFloat(value) : value;

    return Number.isNaN(parsed) ? null : Math.round(parsed);
}

function formatDate(value: string | null): string {
    if (!value) {
        return '-';
    }

    return new Date(value).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

function initials(name: string): string {
    return name
        .split(' ')
        .map((part) => part[0])
        .slice(0, 2)
        .join('');
}

export default function CandidatesPage({
    candidates,
    filters,
    pageSizes,
    statuses,
    savedRoles,
    canCrossSource,
    canCrossSourceManual,
    tokenUsage,
}: Props) {
    const { currentTeam } = usePage().props;
    const teamSlug = currentTeam?.slug ?? '';
    const [search, setSearch] = useState(filters.search ?? '');
    const [modalOpen, setModalOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [rerunOpen, setRerunOpen] = useState(false);
    const [selectedCandidate, setSelectedCandidate] = useState<{
        id: number;
        name: string;
    } | null>(null);
    const firstRender = useRef(true);

    const openDelete = (candidate: Candidate) => {
        setSelectedCandidate({ id: candidate.id, name: candidate.name });
        setDeleteOpen(true);
    };

    const openRerun = (candidate: Candidate) => {
        setSelectedCandidate({ id: candidate.id, name: candidate.name });
        setRerunOpen(true);
    };

    const applyFilters = (overrides: Record<string, unknown>) => {
        router.get(
            screeningsIndex(teamSlug).url,
            {
                search,
                role_id: filters.role_id ?? undefined,
                status: filters.status ?? undefined,
                per_page: filters.per_page,
                ...overrides,
            },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    useEffect(() => {
        if (firstRender.current) {
            firstRender.current = false;

            return;
        }

        const timeout = setTimeout(() => applyFilters({ search }), 350);

        return () => clearTimeout(timeout);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    return (
        <div className="space-y-5 p-6">
            <Head title="Candidates" />
            <StartCandidateScreeningModal
                open={modalOpen}
                onOpenChange={setModalOpen}
                teamSlug={teamSlug}
                tokenAvailable={tokenUsage.available}
                canCrossSource={canCrossSource}
                canCrossSourceManual={canCrossSourceManual}
                savedRoles={savedRoles}
            />
            <DeleteCandidateDialog
                open={deleteOpen}
                onOpenChange={(open) => {
                    setDeleteOpen(open);

                    if (!open) {
                        setSelectedCandidate(null);
                    }
                }}
                candidate={selectedCandidate}
                teamSlug={teamSlug}
            />
            <RerunCandidateDialog
                open={rerunOpen}
                onOpenChange={(open) => {
                    setRerunOpen(open);

                    if (!open) {
                        setSelectedCandidate(null);
                    }
                }}
                candidate={selectedCandidate}
                teamSlug={teamSlug}
            />

            <div>
                <h1 className="text-xl font-bold text-foreground">
                    Candidates
                </h1>
                <p className="mt-0.5 text-sm text-muted-foreground">
                    {candidates.total} screening
                    {candidates.total === 1 ? '' : 's'} total
                </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
                <div className="flex min-w-52 items-center gap-2 rounded-md border border-border bg-card px-3 py-2">
                    <Search size={14} className="text-muted-foreground" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by name, email, role…"
                        className="w-48 bg-transparent text-sm text-foreground outline-none"
                    />
                </div>

                {savedRoles.length > 0 && (
                    <RoleCombobox
                        roles={savedRoles}
                        value={filters.role_id}
                        onChange={(roleId) =>
                            applyFilters({
                                role_id: roleId ?? undefined,
                            })
                        }
                    />
                )}

                {(['all', ...statuses] as string[]).map((status) => {
                    const active =
                        status === 'all'
                            ? filters.status === null
                            : filters.status === status;

                    return (
                        <button
                            key={status}
                            type="button"
                            onClick={() =>
                                applyFilters({
                                    status:
                                        status === 'all' ? undefined : status,
                                })
                            }
                            className="cursor-pointer rounded px-2.5 py-1.5 text-[10px] font-bold tracking-widest transition-all"
                            style={{
                                background: active
                                    ? 'color-mix(in oklch, var(--primary) 12%, transparent)'
                                    : 'var(--c-surface)',
                                color: active
                                    ? 'var(--c-cyan)'
                                    : 'var(--c-muted)',
                                border: `1px solid ${active ? 'color-mix(in oklch, var(--primary) 35%, transparent)' : 'var(--c-border)'}`,
                            }}
                        >
                            {status.toUpperCase()}
                        </button>
                    );
                })}
            </div>

            <div className="rounded-lg border border-border bg-card">
                <div className="flex items-center justify-between border-b border-border px-4 py-3">
                    <p className="text-sm font-semibold text-foreground">
                        Candidate Screenings
                    </p>
                    <Button size="sm" onClick={() => setModalOpen(true)}>
                        <Plus size={13} />
                        New Candidate
                    </Button>
                </div>
                <div className="overflow-x-auto">
                <table className="w-full min-w-[800px]">
                    <thead>
                        <tr className="border-b border-border">
                            {[
                                'Candidate',
                                'Role',
                                'Status',
                                'Score',
                                'Integrity',
                                'Rounds',
                                'Screened',
                            ].map((header, index) => (
                                <th
                                    key={header}
                                    className={`px-4 py-3 text-[10px] font-bold tracking-widest text-muted-foreground ${index === 0 || index === 1 ? 'text-left' : 'text-right'}`}
                                >
                                    {header}
                                </th>
                            ))}
                            <th className="w-10 px-2 py-3" aria-label="Actions" />
                            <th className="w-10 px-2 py-3" aria-label="View" />
                        </tr>
                    </thead>
                    <tbody>
                        {candidates.data.length === 0 && (
                            <tr>
                                <td
                                    colSpan={9}
                                    className="px-4 py-12 text-center text-sm text-muted-foreground"
                                >
                                    No candidates match the current filters.
                                </td>
                            </tr>
                        )}
                        {candidates.data.map((candidate, index) => {
                            const score = toScore(candidate.integrity_score);
                            const isComplete = candidate.status === 'complete';
                            const roleTitle =
                                candidate.job_role_title ??
                                candidate.role ??
                                null;

                            return (
                                <tr
                                    key={candidate.id}
                                    onClick={() =>
                                        router.visit(
                                            screeningShow.url([
                                                teamSlug,
                                                candidate.id,
                                            ]),
                                        )
                                    }
                                    className="group cursor-pointer transition-colors hover:bg-muted/50"
                                    style={{
                                        borderBottom:
                                            index < candidates.data.length - 1
                                                ? '1px solid var(--c-border)'
                                                : 'none',
                                    }}
                                >
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2.5">
                                            <div
                                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded text-xs font-bold"
                                                style={{
                                                    background:
                                                        'color-mix(in oklch, var(--primary) 10%, transparent)',
                                                    color: 'var(--c-cyan)',
                                                }}
                                            >
                                                {initials(candidate.name)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-foreground group-hover:underline">
                                                    {candidate.name}
                                                </p>
                                                {candidate.email && (
                                                    <p className="text-[10px] text-muted-foreground">
                                                        {candidate.email}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td
                                        className="px-4 py-3"
                                        onClick={(event) =>
                                            event.stopPropagation()
                                        }
                                    >
                                        {candidate.role_id && roleTitle ? (
                                            <Link
                                                href={roleShow.url([
                                                    teamSlug,
                                                    candidate.role_id,
                                                ])}
                                                className="text-xs text-muted-foreground hover:text-primary hover:underline"
                                            >
                                                {roleTitle}
                                            </Link>
                                        ) : (
                                            <span className="text-xs text-muted-foreground">
                                                {roleTitle ?? '-'}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex justify-end">
                                            <StatusBadge
                                                status={candidate.status}
                                            />
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex justify-end">
                                            {isComplete && score !== null ? (
                                                <ScoreRing
                                                    score={score}
                                                    size={36}
                                                    strokeWidth={3}
                                                    labelSize="sm"
                                                />
                                            ) : (
                                                <span className="font-mono text-sm text-muted-foreground">
                                                    -
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex justify-end">
                                            {isComplete && score !== null ? (
                                                <IntegrityBadge
                                                    level={getIntegrityLevel(
                                                        score,
                                                    )}
                                                />
                                            ) : (
                                                <span className="text-xs text-muted-foreground">
                                                    -
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-right font-mono text-xs text-muted-foreground">
                                        {candidate.rounds_count ?? 0}
                                    </td>
                                    <td className="px-4 py-3 text-right font-mono text-[11px] text-muted-foreground">
                                        {formatDate(candidate.processed_at)}
                                    </td>
                                    <td className="px-2 py-3 text-right">
                                        <CandidateRowActions
                                            candidateId={candidate.id}
                                            teamSlug={teamSlug}
                                            status={candidate.status}
                                            onRerun={() =>
                                                openRerun(candidate)
                                            }
                                            onDelete={() =>
                                                openDelete(candidate)
                                            }
                                        />
                                    </td>
                                    <td className="px-2 py-3 text-right">
                                        <ChevronRight
                                            size={16}
                                            className="text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
                                        />
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                </div>
                <TablePagination
                    meta={candidates}
                    perPage={filters.per_page}
                    pageSizes={pageSizes}
                    only={['candidates', 'filters']}
                />
            </div>
        </div>
    );
}

CandidatesPage.layout = (props: { currentTeam?: { slug: string } | null }) => ({
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: props.currentTeam
                ? dashboardRoute.url(props.currentTeam.slug)
                : '/',
        },
        {
            title: 'Candidates',
            href: props.currentTeam
                ? screeningsIndex(props.currentTeam.slug).url
                : '/',
        },
    ],
});
