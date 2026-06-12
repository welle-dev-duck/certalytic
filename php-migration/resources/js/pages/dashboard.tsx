import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    Activity,
    ChevronRight,
    Plus,
    Search,
    ShieldAlert,
    ShieldCheck,
    TrendingUp,
    Users,
} from 'lucide-react';
import DecisionSupportDisclaimer from '@/components/decision-support-disclaimer';
import DataPrivacyPanel from '@/components/marketing/data-privacy-panel';
import { useEffect, useRef, useState } from 'react';
import {
    Area,
    AreaChart,
    Bar,
    CartesianGrid,
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import CandidateRowActions from '@/components/candidates/candidate-row-actions';
import DeleteCandidateDialog from '@/components/candidates/delete-candidate-dialog';
import RerunCandidateDialog from '@/components/candidates/rerun-candidate-dialog';
import StartCandidateScreeningModal from '@/components/candidates/start-screening-modal';
import { ScoreRing } from '@/components/certalytic/score-ring';
import { FlagBadge, StatusBadge } from '@/components/certalytic/status-badge';
import TablePagination from '@/components/certalytic/table-pagination';
import { Button } from '@/components/ui/button';
import { getIntegrityLevel, getScoreColor } from '@/lib/integrity';
import type { Flag } from '@/lib/integrity';
import { cn } from '@/lib/utils';
import { dashboard as dashboardRoute } from '@/routes';
import { show as roleShow } from '@/routes/roles';
import { show as screeningShow } from '@/routes/candidates';
import type { Paginated } from '@/types/pagination';

type RecentScreening = {
    id: number;
    name: string;
    role: string | null;
    role_id: number | null;
    status: string;
    integrity_score: string | number | null;
    flags: Flag[];
    created_at: string | null;
    processed_at: string | null;
};

type RiskSlice = { name: string; value: number; color: string };
type RiskDatum = RiskSlice & { total: number };

type TrendPoint = { date: string; avgScore: number | null; flagged: number };

type Stats = {
    total: number;
    scored: number;
    flagged: number;
    avg_integrity: number | null;
};

type Props = {
    recentScreenings: Paginated<RecentScreening>;
    filters: { search: string; per_page: number };
    pageSizes: number[];
    stats: Stats;
    riskDistribution: RiskSlice[];
    trend: TrendPoint[];
    canCrossSource: boolean;
    canCrossSourceManual: boolean;
    roles: { id: number; title: string }[];
    tokenUsage: { available: number };
};

const TrendTooltip = ({
    active,
    payload,
    label,
}: {
    active?: boolean;
    payload?: { value: number; name: string; color: string }[];
    label?: string;
}) => {
    if (active && payload && payload.length) {
        return (
            <div className="rounded border border-border bg-popover p-2.5 text-xs text-popover-foreground">
                <p className="mb-1 font-semibold">{label}</p>
                {payload.map((p) => (
                    <p key={p.name} style={{ color: p.color }}>
                        {p.name}:{' '}
                        <span className="font-mono font-bold">{p.value}</span>
                    </p>
                ))}
            </div>
        );
    }

    return null;
};

const PieTooltip = ({
    active,
    payload,
}: {
    active?: boolean;
    payload?: { name: string; value: number; payload: RiskDatum }[];
}) => {
    if (active && payload && payload.length) {
        const slice = payload[0];
        const total = slice.payload.total;
        const pct = total > 0 ? Math.round((slice.value / total) * 100) : 0;

        return (
            <div className="rounded border border-border bg-popover p-2.5 text-xs text-popover-foreground">
                <p className="flex items-center gap-2 font-semibold">
                    <span
                        className="h-2 w-2 rounded-full"
                        style={{ background: slice.payload.color }}
                    />
                    {slice.name}
                </p>
                <p
                    className="mt-1 font-mono"
                    style={{ color: slice.payload.color }}
                >
                    {slice.value}{' '}
                    <span className="text-muted-foreground">({pct}%)</span>
                </p>
            </div>
        );
    }

    return null;
};

function initials(name: string): string {
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
}

function levelColor(score: number): { text: string; bg: string } {
    const level = getIntegrityLevel(score);
    const text =
        level === 'low' ? '#EF4444' : level === 'medium' ? '#F59E0B' : '#10B981';
    const rgb =
        level === 'low'
            ? '239,68,68'
            : level === 'medium'
              ? '245,158,11'
              : '16,185,129';

    return { text, bg: `rgba(${rgb},0.12)` };
}

function toScore(value: string | number | null): number {
    if (value === null) {
        return 0;
    }

    const parsed = typeof value === 'string' ? parseFloat(value) : value;

    return Number.isNaN(parsed) ? 0 : parsed;
}

export default function DashboardPage({
    recentScreenings,
    filters,
    pageSizes,
    stats,
    riskDistribution,
    trend,
    canCrossSource,
    canCrossSourceManual,
    roles,
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

    useEffect(() => {
        if (firstRender.current) {
            firstRender.current = false;

            return;
        }

        const timeout = setTimeout(() => {
            router.get(
                dashboardRoute.url(teamSlug),
                { search, per_page: filters.per_page },
                {
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                    only: ['recentScreenings', 'filters'],
                },
            );
        }, 350);

        return () => clearTimeout(timeout);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    const openDelete = (candidate: RecentScreening) => {
        setSelectedCandidate({ id: candidate.id, name: candidate.name });
        setDeleteOpen(true);
    };

    const openRerun = (candidate: RecentScreening) => {
        setSelectedCandidate({ id: candidate.id, name: candidate.name });
        setRerunOpen(true);
    };

    const riskTotal = riskDistribution.reduce((sum, r) => sum + r.value, 0);
    const riskData: RiskDatum[] = riskDistribution.map((r) => ({
        ...r,
        total: riskTotal,
    }));
    const avgScore = stats.avg_integrity ?? 0;

    const statCards = [
        {
            label: 'Total Candidates',
            value: stats.total,
            sub: 'Across all roles',
            icon: Users,
            color: 'var(--primary)',
            bg: 'color-mix(in oklch, var(--primary) 10%, transparent)',
        },
        {
            label: 'High Risk Flagged',
            value: stats.flagged,
            sub:
                stats.scored > 0
                    ? `${Math.round((stats.flagged / stats.scored) * 100)}% of scored`
                    : 'No scored candidates',
            icon: ShieldAlert,
            color: '#EF4444',
            bg: 'rgba(239,68,68,0.1)',
        },
        {
            label: 'Avg Integrity Score',
            value: stats.avg_integrity ?? '-',
            sub: 'Completed screenings',
            icon: Activity,
            color: getScoreColor(avgScore),
            bg: `rgba(${avgScore >= 75 ? '16,185,129' : avgScore >= 50 ? '245,158,11' : '239,68,68'},0.1)`,
        },
        {
            label: 'Completed Screenings',
            value: stats.scored,
            sub: `of ${stats.total} total`,
            icon: ShieldCheck,
            color: '#10B981',
            bg: 'rgba(16,185,129,0.1)',
        },
    ];

    return (
        <div className="space-y-6 p-6">
            <Head title="Dashboard" />

            <StartCandidateScreeningModal
                open={modalOpen}
                onOpenChange={setModalOpen}
                teamSlug={teamSlug}
                tokenAvailable={tokenUsage.available}
                canCrossSource={canCrossSource}
                canCrossSourceManual={canCrossSourceManual}
                savedRoles={roles}
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

            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h1 className="text-xl font-bold text-foreground">
                        Intelligence Overview
                    </h1>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                        Hiring integrity dashboard
                    </p>

                </div>
                <div
                    className="flex shrink-0 items-center gap-2 self-start rounded px-3 py-1.5 text-xs font-semibold"
                    style={{
                        background: 'rgba(16,185,129,0.1)',
                        color: '#10B981',
                        border: '1px solid rgba(16,185,129,0.25)',
                    }}
                >
                    <span
                        className="h-1.5 w-1.5 rounded-full bg-[#10B981]"
                        style={{ boxShadow: '0 0 6px #10B981' }}
                    />
                    Systems Nominal
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {statCards.map(({ label, value, sub, icon: Icon, color, bg }) => (
                    <div
                        key={label}
                        className="rounded-lg border border-border bg-card p-4"
                    >
                        <div className="mb-3 flex items-start justify-between">
                            <p className="text-xs font-medium tracking-wide text-muted-foreground">
                                {label}
                            </p>
                            <div
                                className="flex h-7 w-7 items-center justify-center rounded"
                                style={{ background: bg }}
                            >
                                <Icon size={14} style={{ color }} />
                            </div>
                        </div>
                        <p
                            className="text-3xl leading-none font-bold tabular-nums"
                            style={{ color }}
                        >
                            {value}
                        </p>
                        <p className="mt-1.5 text-xs text-muted-foreground">
                            {sub}
                        </p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <div className="rounded-lg border border-border bg-card p-4 lg:col-span-2">
                    <div className="mb-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-semibold text-foreground">
                                Integrity Score Trend
                            </p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                                Last 14 days
                            </p>
                        </div>
                        <TrendingUp size={14} className="text-muted-foreground" />
                    </div>
                    <ResponsiveContainer width="100%" height={180}>
                        <AreaChart data={trend}>
                            <defs>
                                <linearGradient
                                    id="scoreGrad"
                                    x1="0"
                                    y1="0"
                                    x2="0"
                                    y2="1"
                                >
                                    <stop
                                        offset="5%"
                                        stopColor="var(--primary)"
                                        stopOpacity={0.25}
                                    />
                                    <stop
                                        offset="95%"
                                        stopColor="var(--primary)"
                                        stopOpacity={0}
                                    />
                                </linearGradient>
                            </defs>
                            <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="var(--border)"
                                vertical={false}
                            />
                            <XAxis
                                dataKey="date"
                                tick={{
                                    fill: 'var(--muted-foreground)',
                                    fontSize: 10,
                                }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <YAxis
                                tick={{
                                    fill: 'var(--muted-foreground)',
                                    fontSize: 10,
                                }}
                                axisLine={false}
                                tickLine={false}
                                domain={[0, 100]}
                            />
                            <Tooltip content={<TrendTooltip />} />
                            <Area
                                type="monotone"
                                dataKey="avgScore"
                                name="Avg Score"
                                stroke="var(--primary)"
                                strokeWidth={2}
                                fill="url(#scoreGrad)"
                                connectNulls
                            />
                            <Bar
                                dataKey="flagged"
                                name="Flags"
                                fill="#EF4444"
                                fillOpacity={0.4}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                <div className="rounded-lg border border-border bg-card p-4">
                    <p className="mb-0.5 text-sm font-semibold text-foreground">
                        Risk Distribution
                    </p>
                    <p className="mb-4 text-xs text-muted-foreground">
                        Current pipeline
                    </p>
                    <div className="flex flex-col items-center">
                        <ResponsiveContainer width="100%" height={130}>
                            <PieChart>
                                <Pie
                                    data={riskData}
                                    dataKey="value"
                                    nameKey="name"
                                    innerRadius={38}
                                    outerRadius={60}
                                    paddingAngle={3}
                                    startAngle={90}
                                    endAngle={-270}
                                >
                                    {riskData.map((entry) => (
                                        <Cell
                                            key={entry.name}
                                            fill={entry.color}
                                            fillOpacity={0.85}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip
                                    content={<PieTooltip />}
                                    cursor={false}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="mt-2 w-full space-y-2">
                            {riskDistribution.map(({ name, value, color }) => (
                                <div
                                    key={name}
                                    className="flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-2">
                                        <span
                                            className="h-2 w-2 rounded-full"
                                            style={{ background: color }}
                                        />
                                        <span className="text-xs text-muted-foreground">
                                            {name}
                                        </span>
                                    </div>
                                    <span className="font-mono text-xs font-bold text-foreground">
                                        {value}{' '}
                                        <span className="text-muted-foreground">
                                            (
                                            {riskTotal > 0
                                                ? Math.round(
                                                      (value / riskTotal) * 100,
                                                  )
                                                : 0}
                                            %)
                                        </span>
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="rounded-lg border border-border bg-card">
                <div className="space-y-3 border-b border-border px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-foreground">
                            Recent Candidate Screenings
                        </p>
                        <Button size="sm" onClick={() => setModalOpen(true)}>
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
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search by candidate name…"
                            className="w-full bg-transparent text-sm text-foreground outline-none"
                        />
                    </div>
                </div>

                {recentScreenings.data.length === 0 ? (
                    <div className="px-4 py-12 text-center text-sm text-muted-foreground">
                        {search.trim() !== ''
                            ? 'No candidates match your search.'
                            : 'No screenings yet.'}
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                        <table className="w-full min-w-[720px]">
                            <thead>
                                <tr className="border-b border-border">
                                    {[
                                        'Candidate',
                                        'Role',
                                        'Status',
                                        'Score',
                                        'Flags',
                                        'Created At',
                                    ].map((h) => (
                                        <th
                                            key={h}
                                            className="px-4 py-2.5 text-left text-[10px] font-bold tracking-widest text-muted-foreground"
                                        >
                                            {h}
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
                                {recentScreenings.data.map((c, i) => {
                                    const score = toScore(c.integrity_score);
                                    const isComplete = c.status === 'complete';
                                    const colors = levelColor(score);
                                    const isLast =
                                        i === recentScreenings.data.length - 1;

                                    return (
                                        <tr
                                            key={c.id}
                                            onClick={() =>
                                                router.visit(
                                                    screeningShow.url([
                                                        teamSlug,
                                                        c.id,
                                                    ]),
                                                )
                                            }
                                            className={cn(
                                                'group cursor-pointer transition-colors hover:bg-muted/50',
                                                !isLast && 'border-b border-border',
                                            )}
                                        >
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2.5">
                                                    <div
                                                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-xs font-bold"
                                                        style={{
                                                            background:
                                                                isComplete
                                                                    ? colors.bg
                                                                    : 'var(--c-surface-2)',
                                                            color: isComplete
                                                                ? colors.text
                                                                : 'var(--c-muted)',
                                                        }}
                                                    >
                                                        {initials(c.name)}
                                                    </div>
                                                    <span className="text-sm font-semibold text-foreground group-hover:underline">
                                                        {c.name}
                                                    </span>
                                                </div>
                                            </td>
                                            <td
                                                className="px-4 py-3"
                                                onClick={(event) =>
                                                    event.stopPropagation()
                                                }
                                            >
                                                {c.role_id && c.role ? (
                                                    <Link
                                                        href={roleShow.url([
                                                            teamSlug,
                                                            c.role_id,
                                                        ])}
                                                        className="text-xs text-muted-foreground hover:text-primary hover:underline"
                                                    >
                                                        {c.role}
                                                    </Link>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">
                                                        {c.role ?? '-'}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <StatusBadge status={c.status} />
                                            </td>
                                            <td className="px-4 py-3">
                                                {isComplete &&
                                                c.integrity_score !== null ? (
                                                    <ScoreRing
                                                        score={score}
                                                        size={32}
                                                        strokeWidth={3}
                                                        labelSize="sm"
                                                    />
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">
                                                        -
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                {!isComplete ? (
                                                    <span className="text-xs text-muted-foreground">
                                                        -
                                                    </span>
                                                ) : c.flags.length === 0 ? (
                                                    <span className="text-xs text-muted-foreground">
                                                        None
                                                    </span>
                                                ) : (
                                                    <div className="flex flex-wrap gap-1">
                                                        {c.flags
                                                            .slice(0, 2)
                                                            .map((f, fi) => (
                                                                <FlagBadge
                                                                    key={fi}
                                                                    flag={f}
                                                                />
                                                            ))}
                                                        {c.flags.length > 2 && (
                                                            <span className="text-[10px] font-bold text-muted-foreground">
                                                                +
                                                                {c.flags.length -
                                                                    2}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                                                {c.created_at
                                                    ? new Date(
                                                          c.created_at,
                                                      ).toLocaleDateString()
                                                    : '-'}
                                            </td>
                                            <td className="px-2 py-3 text-right">
                                                <CandidateRowActions
                                                    candidateId={c.id}
                                                    teamSlug={teamSlug}
                                                    status={c.status}
                                                    onRerun={() =>
                                                        openRerun(c)
                                                    }
                                                    onDelete={() =>
                                                        openDelete(c)
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
                            meta={recentScreenings}
                            perPage={filters.per_page}
                            pageSizes={pageSizes}
                            only={['recentScreenings', 'filters']}
                        />
                    </>
                )}
            </div>

            <DataPrivacyPanel />
        </div>
    );
}

DashboardPage.layout = (props: { currentTeam?: { slug: string } | null }) => ({
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: props.currentTeam
                ? dashboardRoute.url(props.currentTeam.slug)
                : '/',
        },
    ],
});
