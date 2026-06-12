import { Form, Head, Link, router, usePage } from '@inertiajs/react';
import { ChevronRight, ArrowLeft, Pencil, Plus, Search, Trash2, Upload } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import CandidateRowActions from '@/components/candidates/candidate-row-actions';
import DeleteCandidateDialog from '@/components/candidates/delete-candidate-dialog';
import RerunCandidateDialog from '@/components/candidates/rerun-candidate-dialog';
import StartCandidateScreeningModal from '@/components/candidates/start-screening-modal';
import { ScoreRing } from '@/components/certalytic/score-ring';
import { StatusBadge } from '@/components/certalytic/status-badge';
import TablePagination from '@/components/certalytic/table-pagination';
import RoleExportAction, {
    type RoleExportStatus,
} from '@/components/roles/role-export-action';
import RoleFormDialog from '@/components/roles/role-form-dialog';
import { Button } from '@/components/ui/button';
import { getScoreColor } from '@/lib/integrity';
import { dashboard as dashboardRoute } from '@/routes';
import {
    destroy as destroyRole,
    index as rolesIndex,
    show as roleShow,
} from '@/routes/roles';
import {
    destroy as destroyDocument,
    store as storeDocument,
} from '@/routes/roles/documents';
import { show as screeningShow } from '@/routes/candidates';
import type { TokenUsage } from '@/types/candidates';
import type { Paginated } from '@/types/pagination';
import type { JobRole, RoleCandidate } from '@/types/roles';

type RoleStats = {
    avg_integrity: number | null;
    scored: number;
    distribution: { high: number; medium: number; low: number };
};

type Props = {
    role: JobRole;
    candidates: Paginated<RoleCandidate>;
    stats: RoleStats;
    filters: { search: string; per_page: number };
    pageSizes: number[];
    canUploadDocuments: boolean;
    maxDocuments: number;
    tokenUsage: TokenUsage;
    canCrossSource: boolean;
    canCrossSourceManual: boolean;
    latestExport: RoleExportStatus | null;
};

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

function toScore(value: string | number | null): number | null {
    if (value === null) {
        return null;
    }

    const parsed = typeof value === 'string' ? parseFloat(value) : value;

    return Number.isNaN(parsed) ? null : Math.round(parsed);
}

const DIST_META: { key: 'high' | 'medium' | 'low'; label: string; color: string }[] =
    [
        { key: 'high', label: 'High (75+)', color: '#10B981' },
        { key: 'medium', label: 'Medium (50–74)', color: '#F59E0B' },
        { key: 'low', label: 'Low (<50)', color: '#EF4444' },
    ];

function CollapsibleJobDescription({ text }: { text: string }) {
    const [expanded, setExpanded] = useState(false);
    const [isTruncated, setIsTruncated] = useState(false);
    const ref = useRef<HTMLParagraphElement>(null);

    useEffect(() => {
        const el = ref.current;

        if (!el || expanded) {
            return;
        }

        const checkTruncation = () => {
            setIsTruncated(el.scrollHeight > el.clientHeight + 1);
        };

        checkTruncation();

        const observer = new ResizeObserver(checkTruncation);
        observer.observe(el);

        return () => observer.disconnect();
    }, [text, expanded]);

    const showToggle = expanded || isTruncated;

    return (
        <div>
            <p
                ref={ref}
                className={cn(
                    'text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground',
                    !expanded && 'max-h-40 overflow-hidden',
                )}
            >
                {text}
            </p>
            {showToggle && (
                <button
                    type="button"
                    onClick={() => setExpanded((open) => !open)}
                    className="mt-2 text-xs font-medium text-primary hover:underline"
                >
                    {expanded ? 'Show less' : 'Show more'}
                </button>
            )}
        </div>
    );
}

export default function RoleShow({
    role,
    candidates,
    stats,
    filters,
    pageSizes,
    canUploadDocuments,
    maxDocuments,
    tokenUsage,
    canCrossSource,
    canCrossSourceManual,
    latestExport,
}: Props) {
    const { currentTeam } = usePage().props;
    const teamSlug = currentTeam?.slug ?? '';
    const [editOpen, setEditOpen] = useState(false);
    const [screeningOpen, setScreeningOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [rerunOpen, setRerunOpen] = useState(false);
    const [selectedCandidate, setSelectedCandidate] = useState<{
        id: number;
        name: string;
    } | null>(null);
    const [search, setSearch] = useState(filters.search ?? '');
    const firstRender = useRef(true);

    useEffect(() => {
        if (firstRender.current) {
            firstRender.current = false;

            return;
        }

        const timeout = setTimeout(() => {
            router.get(
                roleShow.url([teamSlug, role.id]),
                { search, per_page: filters.per_page },
                { preserveState: true, preserveScroll: true, replace: true },
            );
        }, 350);

        return () => clearTimeout(timeout);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    const openDelete = (candidate: RoleCandidate) => {
        setSelectedCandidate({ id: candidate.id, name: candidate.name });
        setDeleteOpen(true);
    };

    const openRerun = (candidate: RoleCandidate) => {
        setSelectedCandidate({ id: candidate.id, name: candidate.name });
        setRerunOpen(true);
    };

    const deleteRole = () => {
        if (
            confirm(
                `Delete "${role.title}"? Candidates keep their snapshot title and description.`,
            )
        ) {
            router.delete(destroyRole.url([teamSlug, role.id]));
        }
    };

    return (
        <div className="space-y-5 p-6">
            <Head title={role.title} />

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

            <div className="flex items-center justify-between gap-4">
                <Link
                    href={rolesIndex(teamSlug).url}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground"
                >
                    <ArrowLeft size={13} />
                    Back to Roles
                </Link>

                <div className="flex items-center gap-2">
                    <RoleExportAction
                        teamSlug={teamSlug}
                        roleId={role.id}
                        latestExport={latestExport}
                    />
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setEditOpen(true)}
                    >
                        <Pencil size={14} />
                        Edit
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={deleteRole}
                    >
                        <Trash2 size={14} />
                        Delete
                    </Button>
                </div>
            </div>

            <div>
                <h1 className="text-2xl font-bold text-foreground">
                    {role.title}
                </h1>
                <p className="mt-0.5 text-sm text-muted-foreground">
                    Created {formatDate(role.created_at)} ·{' '}
                    {role.candidates_count} screening
                    {role.candidates_count === 1 ? '' : 's'}
                </p>
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-[300px_1fr]">
                <div className="space-y-5">
                    <div
                        className="rounded-lg p-5 border border-border bg-card"
                    >
                        <p
                            className="mb-4 text-[10px] font-bold tracking-widest text-muted-foreground"
                        >
                            AVG INTEGRITY
                        </p>
                        <div className="flex flex-col items-center">
                            {stats.avg_integrity !== null ? (
                                <ScoreRing
                                    score={stats.avg_integrity}
                                    size={132}
                                    strokeWidth={10}
                                    labelSize="lg"
                                />
                            ) : (
                                <div
                                    className="flex h-[132px] w-[132px] items-center justify-center rounded-full text-sm"
                                    style={{
                                        color: 'var(--c-muted)',
                                        border: '2px dashed var(--c-border)',
                                    }}
                                >
                                    No scores
                                </div>
                            )}
                            <p
                                className="mt-3 text-xs text-muted-foreground"
                            >
                                across {stats.scored} scored candidate
                                {stats.scored === 1 ? '' : 's'}
                            </p>
                        </div>

                        <div className="mt-5 space-y-2.5">
                            {DIST_META.map((item) => {
                                const value = stats.distribution[item.key];
                                const pct =
                                    stats.scored > 0
                                        ? (value / stats.scored) * 100
                                        : 0;

                                return (
                                    <div key={item.key}>
                                        <div className="mb-1 flex items-center justify-between">
                                            <span
                                                className="text-[11px]"
                                                style={{
                                                    color: 'var(--c-muted)',
                                                }}
                                            >
                                                {item.label}
                                            </span>
                                            <span
                                                className="font-mono text-[11px] font-bold"
                                                style={{ color: item.color }}
                                            >
                                                {value}
                                            </span>
                                        </div>
                                        <div
                                            className="h-1.5 w-full overflow-hidden rounded-full"
                                            style={{
                                                background: 'var(--c-surface-2)',
                                            }}
                                        >
                                            <div
                                                className="h-full rounded-full"
                                                style={{
                                                    width: `${pct}%`,
                                                    background: item.color,
                                                    transition: 'width 0.5s ease',
                                                }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                </div>

                <div className="space-y-5">
                    <div
                        className="rounded-lg p-5 border border-border bg-card"
                    >
                        <p
                            className="mb-2 text-[10px] font-bold tracking-widest text-muted-foreground"
                        >
                            JOB DESCRIPTION
                        </p>
                        {role.description ? (
                            <CollapsibleJobDescription text={role.description} />
                        ) : (
                            <p
                                className="text-sm italic text-muted-foreground"
                            >
                                No description provided.
                            </p>
                        )}
                    </div>

                    {canUploadDocuments && (
                        <div
                            className="rounded-lg p-5 border border-border bg-card"
                        >
                            <p
                                className="mb-2 text-[10px] font-bold tracking-widest text-muted-foreground"
                            >
                                TARGETED SCAN ASSETS
                            </p>
                            <p
                                className="mb-3 text-xs text-muted-foreground"
                            >
                                Attach up to {maxDocuments} documents. OCR text is
                                cross-referenced against interview transcripts.
                            </p>
                            {role.documents.length > 0 && (
                                <ul className="mb-3 space-y-2">
                                    {role.documents.map((document) => (
                                        <li
                                            key={document.id}
                                            className="flex items-center justify-between gap-2 rounded px-3 py-2 text-xs"
                                            style={{
                                                background: 'var(--c-surface-2)',
                                                border: '1px solid var(--c-border)',
                                                color: 'var(--c-text)',
                                            }}
                                        >
                                            <span>
                                                {document.original_name}{' '}
                                                <span
                                                    style={{
                                                        color: 'var(--c-muted)',
                                                    }}
                                                >
                                                    ({document.ocr_status})
                                                </span>
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    router.delete(
                                                        destroyDocument.url([
                                                            teamSlug,
                                                            role.id,
                                                            document.id,
                                                        ]),
                                                    )
                                                }
                                                style={{ color: '#EF4444' }}
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                            {role.documents.length < maxDocuments && (
                                <Form
                                    {...storeDocument.form([teamSlug, role.id])}
                                    encType="multipart/form-data"
                                    className="flex flex-wrap items-center gap-3"
                                >
                                    {({ processing, errors }) => (
                                        <>
                                            <input
                                                type="file"
                                                name="document"
                                                accept=".pdf,.doc,.docx,.md,.markdown,.txt"
                                                required
                                                className="flex-1 text-xs text-muted-foreground"
                                            />
                                            <button
                                                type="submit"
                                                disabled={processing}
                                                className="flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
                                                style={{
                                                    background:
                                                        'color-mix(in oklch, var(--primary) 12%, transparent)',
                                                    color: 'var(--c-cyan)',
                                                    border: '1px solid color-mix(in oklch, var(--primary) 30%, transparent)',
                                                }}
                                            >
                                                <Upload size={12} />
                                                Upload
                                            </button>
                                            {errors.document && (
                                                <p
                                                    className="w-full text-xs"
                                                    style={{ color: '#EF4444' }}
                                                >
                                                    {errors.document}
                                                </p>
                                            )}
                                        </>
                                    )}
                                </Form>
                            )}
                        </div>
                    )}

                    <div className="rounded-lg border border-border bg-card">
                        <div className="space-y-3 border-b border-border px-4 py-3">
                            <div className="flex items-center justify-between gap-3">
                                <p className="text-sm font-semibold text-foreground">
                                    Candidates
                                </p>
                                <Button
                                    size="sm"
                                    onClick={() => setScreeningOpen(true)}
                                >
                                    <Plus size={13} />
                                    New Candidate
                                </Button>
                            </div>
                            <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2">
                                <Search
                                    size={14}
                                    className="shrink-0 text-muted-foreground"
                                />
                                <input
                                    value={search}
                                    onChange={(event) =>
                                        setSearch(event.target.value)
                                    }
                                    placeholder="Search by name or email…"
                                    className="w-full bg-transparent text-sm text-foreground outline-none"
                                />
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                        <table className="w-full min-w-[640px]">
                            <thead>
                                <tr
                                    style={{
                                        borderBottom: '1px solid var(--c-border)',
                                    }}
                                >
                                    {[
                                        'Candidate',
                                        'Status',
                                        'Rounds',
                                        'Score',
                                        'Screened',
                                    ].map((header, index) => (
                                        <th
                                            key={header}
                                            className={`px-4 py-2.5 text-[10px] font-bold tracking-widest text-muted-foreground ${index === 0 ? 'text-left' : 'text-right'}`}
                                        >
                                            {header}
                                        </th>
                                    ))}
                                    <th
                                        className="w-10 px-2 py-2.5"
                                        aria-label="Actions"
                                    />
                                    <th
                                        className="w-10 px-2 py-2.5"
                                        aria-label="View"
                                    />
                                </tr>
                            </thead>
                            <tbody>
                                {candidates.data.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="px-4 py-12 text-center text-sm text-muted-foreground"
                                        >
                                            {search.trim() !== ''
                                                ? 'No candidates match your search.'
                                                : 'No candidates screened for this role yet.'}
                                        </td>
                                    </tr>
                                )}
                                {candidates.data.map((candidate, index) => {
                                    const score = toScore(
                                        candidate.integrity_score,
                                    );

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
                                                    index <
                                                    candidates.data.length - 1
                                                        ? '1px solid var(--c-border)'
                                                        : 'none',
                                            }}
                                        >
                                            <td className="px-4 py-3">
                                                <p className="text-sm font-semibold text-foreground group-hover:underline">
                                                    {candidate.name}
                                                </p>
                                                <p
                                                    className="text-[11px]"
                                                    style={{
                                                        color: 'var(--c-muted)',
                                                    }}
                                                >
                                                    {candidate.email ?? '-'}
                                                </p>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex justify-end">
                                                    <StatusBadge
                                                        status={candidate.status}
                                                    />
                                                </div>
                                            </td>
                                            <td
                                                className="px-4 py-3 text-right font-mono text-xs"
                                                style={{
                                                    color: 'var(--c-muted)',
                                                }}
                                            >
                                                {candidate.rounds_count}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                {score !== null ? (
                                                    <span
                                                        className="font-mono text-xs font-bold"
                                                        style={{
                                                            color: getScoreColor(
                                                                score,
                                                            ),
                                                        }}
                                                    >
                                                        {score}
                                                    </span>
                                                ) : (
                                                    <span
                                                        className="text-xs"
                                                        style={{
                                                            color: 'var(--c-muted)',
                                                        }}
                                                    >
                                                        -
                                                    </span>
                                                )}
                                            </td>
                                            <td
                                                className="px-4 py-3 text-right font-mono text-[11px]"
                                                style={{
                                                    color: 'var(--c-muted)',
                                                }}
                                            >
                                                {formatDate(
                                                    candidate.processed_at,
                                                )}
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
                            only={['candidates', 'filters', 'stats']}
                        />
                    </div>
                </div>
            </div>

            <RoleFormDialog
                open={editOpen}
                onOpenChange={setEditOpen}
                teamSlug={teamSlug}
                mode="edit"
                role={role}
            />

            <StartCandidateScreeningModal
                open={screeningOpen}
                onOpenChange={setScreeningOpen}
                teamSlug={teamSlug}
                tokenAvailable={tokenUsage.available}
                canCrossSource={canCrossSource}
                canCrossSourceManual={canCrossSourceManual}
                savedRoles={[role]}
                preselectedRoleId={role.id}
                lockRole
            />
        </div>
    );
}

RoleShow.layout = (props: {
    currentTeam?: { slug: string } | null;
    role: { id: number; title: string };
}) => ({
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: props.currentTeam
                ? dashboardRoute.url(props.currentTeam.slug)
                : '/',
        },
        {
            title: 'Roles',
            href: props.currentTeam
                ? rolesIndex(props.currentTeam.slug).url
                : '/',
        },
        {
            title: props.role.title,
            href: props.currentTeam
                ? roleShow.url([props.currentTeam.slug, props.role.id])
                : '/',
        },
    ],
});
