import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    AlertCircle,
    AlertTriangle,
    ArrowLeft,
    BarChart2,
    Brain,
    CheckCircle2,
    Code2,
    Download,
    FileText,
    Globe,
    Mic,
    RefreshCw,
    Rss,
    Scissors,
    Sparkles,
    Trash2,
    Users,
    XCircle,
} from 'lucide-react';
import { useState } from 'react';
import DeleteCandidateDialog from '@/components/candidates/delete-candidate-dialog';
import RerunCandidateDialog from '@/components/candidates/rerun-candidate-dialog';
import { Button } from '@/components/ui/button';
import {
    Bar,
    BarChart,
    Cell,
    ResponsiveContainer,
    XAxis,
    YAxis,
} from 'recharts';
import IntegrityRadarChart from '@/components/certalytic/integrity-radar-chart';
import { ScoreRing } from '@/components/certalytic/score-ring';
import {
    FlagBadge,
    IntegrityBadge,
    StatusBadge,
} from '@/components/certalytic/status-badge';
import type {
    CandidateReport,
    SupplementaryAnalysis,
} from '@/lib/candidate-report';
import ScreeningProcessingStatus from '@/components/candidates/screening-processing-status';
import DecisionSupportDisclaimer from '@/components/decision-support-disclaimer';
import { dashboard as dashboardRoute } from '@/routes';
import {
    index as screeningsIndex,
    exportMethod as exportScreeningReport,
    show as screeningShow,
} from '@/routes/candidates';
import type { Candidate } from '@/types/candidates';

type Props = {
    candidate: Candidate;
    report: CandidateReport;
    showFullBreakdown: boolean;
};

const TABS = [
    'CV Analysis',
    'Platform Cross-Ref',
    'Behaviour Analysis',
    'Personality Analysis',
    'Interview Analysis',
    'Signal Summary',
] as const;
type Tab = (typeof TABS)[number];

const TAB_ICONS: Record<Tab, React.ReactNode> = {
    'CV Analysis': <FileText size={13} />,
    'Platform Cross-Ref': <Globe size={13} />,
    'Interview Analysis': <Mic size={13} />,
    'Behaviour Analysis': <Users size={13} />,
    'Personality Analysis': <Sparkles size={13} />,
    'Signal Summary': <BarChart2 size={13} />,
};

function SupplementaryAnalysisPanel({
    title,
    analysis,
    indicatorLabel,
    showMotivation = false,
}: {
    title: string;
    analysis: SupplementaryAnalysis;
    indicatorLabel: string;
    showMotivation?: boolean;
}) {
    return (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">
                <Panel title={title}>
                    <p className="mb-4 rounded border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs text-muted-foreground">
                        Supplementary hiring context only. Not included in the
                        hiring integrity score.
                    </p>
                    <p className="text-sm leading-relaxed text-foreground">
                        {analysis.summary}
                    </p>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <div className="rounded border border-border bg-muted/20 p-3">
                            <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                                {analysis.detailLabel}
                            </p>
                            <p className="mt-2 text-sm text-foreground">
                                {analysis.detail}
                            </p>
                        </div>
                        {analysis.traits.length > 0 ? (
                            <div className="rounded border border-border bg-muted/20 p-3">
                                <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                                    Observed traits
                                </p>
                                <ul className="mt-2 space-y-1.5 text-sm text-foreground">
                                    {analysis.traits.map((trait) => (
                                        <li key={trait}>• {trait}</li>
                                    ))}
                                </ul>
                            </div>
                        ) : null}
                    </div>
                </Panel>
            </div>
            <div className="space-y-4">
                {analysis.indicators.length > 0 ? (
                    <Panel title={indicatorLabel}>
                        <ul className="space-y-2 text-xs text-foreground">
                            {analysis.indicators.map((indicator) => (
                                <li
                                    key={indicator}
                                    className="rounded border border-border bg-muted/20 p-2.5"
                                >
                                    {indicator}
                                </li>
                            ))}
                        </ul>
                    </Panel>
                ) : null}
                {showMotivation &&
                analysis.motivationSignals.length > 0 ? (
                    <Panel title="Motivation signals">
                        <ul className="space-y-2 text-xs text-foreground">
                            {analysis.motivationSignals.map((signal) => (
                                <li
                                    key={signal}
                                    className="rounded border border-border bg-muted/20 p-2.5"
                                >
                                    {signal}
                                </li>
                            ))}
                        </ul>
                    </Panel>
                ) : null}
                {analysis.concerns.length > 0 ? (
                    <Panel title="Watchpoints">
                        <ul className="space-y-2 text-xs text-foreground">
                            {analysis.concerns.map((concern) => (
                                <li
                                    key={concern}
                                    className="rounded border border-destructive/20 bg-destructive/5 p-2.5"
                                >
                                    {concern}
                                </li>
                            ))}
                        </ul>
                    </Panel>
                ) : null}
            </div>
        </div>
    );
}

function formatDate(value: string | null): string {
    if (!value) {
        return '-';
    }

    return new Date(value).toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function InfoRow({
    label,
    value,
    mono = false,
}: {
    label: string;
    value: string | number;
    mono?: boolean;
}) {
    return (
        <div
            className="flex items-center justify-between py-2 border-b border-border"
        >
            <span className="text-xs text-muted-foreground">
                {label}
            </span>
            <span
                className={`text-xs font-semibold text-foreground ${mono ? 'font-mono' : ''}`}
            >
                {value}
            </span>
        </div>
    );
}

function MetricBar({
    label,
    value,
    invert = false,
    explanation,
}: {
    label: string;
    value: number | null;
    invert?: boolean;
    explanation?: string;
}) {
    if (value === null) {
        return (
            <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                        {label}
                    </span>
                    <span className="text-xs font-semibold text-muted-foreground">
                        N/A
                    </span>
                </div>
                {explanation ? (
                    <p className="text-xs leading-relaxed text-muted-foreground">
                        {explanation}
                    </p>
                ) : null}
            </div>
        );
    }

    const pct = Math.min(100, Math.max(0, value));
    const isGood = invert ? pct < 30 : pct > 70;
    const isMedium = invert ? pct < 60 : pct > 40;
    const color = isGood ? '#10B981' : isMedium ? '#F59E0B' : '#EF4444';

    return (
        <div className="space-y-1.5">
            <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                    {label}
                </span>
                <span
                    className="font-mono text-xs font-bold"
                    style={{ color }}
                >
                    {Math.round(value)}%
                </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-border">
                <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, background: color }}
                />
            </div>
            {explanation ? (
                <p className="text-xs leading-relaxed text-muted-foreground">
                    {explanation}
                </p>
            ) : null}
        </div>
    );
}

function Panel({
    title,
    icon,
    children,
}: {
    title: string;
    icon?: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <div
            className="rounded-lg p-4 border border-border bg-card"
        >
            <div className="mb-3 flex items-center gap-2">
                {icon}
                <p
                    className="text-sm font-semibold text-foreground"
                >
                    {title}
                </p>
            </div>
            {children}
        </div>
    );
}

export default function CandidateShow({
    candidate,
    report,
    showFullBreakdown,
}: Props) {
    const { currentTeam } = usePage().props;
    const teamSlug = currentTeam?.slug ?? '';
    const [activeTab, setActiveTab] = useState<Tab>('CV Analysis');
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [rerunOpen, setRerunOpen] = useState(false);

    const isComplete = candidate.status === 'complete';
    const isOngoing =
        candidate.status === 'pending' || candidate.status === 'processing';

    return (
        <div className="space-y-5 p-6">
            <Head title={candidate.name} />

            <DeleteCandidateDialog
                open={deleteOpen}
                onOpenChange={setDeleteOpen}
                candidate={{ id: candidate.id, name: candidate.name }}
                teamSlug={teamSlug}
                onDeleted={() => {
                    router.visit(screeningsIndex(teamSlug).url);
                }}
            />
            <RerunCandidateDialog
                open={rerunOpen}
                onOpenChange={setRerunOpen}
                candidate={{ id: candidate.id, name: candidate.name }}
                teamSlug={teamSlug}
            />

            <div className="flex items-center justify-between gap-4">
                <Link
                    href={screeningsIndex(teamSlug).url}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground"
                >
                    <ArrowLeft size={13} />
                    Back to Candidates
                </Link>

                <div className="flex items-center gap-2">
                    {isComplete ? (
                        <Button size="sm" variant="outline" asChild>
                            <a
                                href={exportScreeningReport.url([
                                    teamSlug,
                                    candidate.id,
                                ])}
                            >
                                <Download size={14} />
                                Export PDF
                            </a>
                        </Button>
                    ) : null}
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setRerunOpen(true)}
                    >
                        <RefreshCw size={14} />
                        Re-run
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteOpen(true)}
                    >
                        <Trash2 size={14} />
                        Delete
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="rounded-lg border border-border bg-card p-5">
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                        <div className="flex shrink-0 flex-col items-center">
                            {isComplete ? (
                                <ScoreRing
                                    score={report.score}
                                    size={120}
                                    strokeWidth={8}
                                    labelSize="lg"
                                />
                            ) : (
                                <div
                                    className="flex h-[120px] w-[120px] items-center justify-center rounded-full text-xs text-muted-foreground"
                                    style={{ border: '2px dashed var(--c-border)' }}
                                >
                                    -
                                </div>
                            )}
                            <p className="mt-3 text-center text-[10px] font-bold tracking-widest text-muted-foreground">
                                HIRING INTEGRITY
                                <br />
                                SCORE
                            </p>
                            {isComplete && (
                                <div className="mt-3">
                                    <IntegrityBadge level={report.level} />
                                </div>
                            )}
                        </div>

                        <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <h1 className="text-2xl font-bold text-foreground">
                                        {candidate.name}
                                    </h1>
                                    <p className="mt-0.5 text-sm text-muted-foreground">
                                        {candidate.job_role_title ??
                                            candidate.role ??
                                            '-'}
                                    </p>
                                </div>
                                <StatusBadge status={candidate.status} />
                            </div>

                            <div className="mt-4 grid grid-cols-2 gap-3">
                                <div className="rounded bg-muted p-2.5">
                                    <p className="text-[10px] font-medium text-muted-foreground">
                                        Status
                                    </p>
                                    <div className="mt-1">
                                        <StatusBadge status={candidate.status} />
                                    </div>
                                </div>
                                <div className="rounded bg-muted p-2.5">
                                    <p className="text-[10px] font-medium text-muted-foreground">
                                        Scan Created At
                                    </p>
                                    <p className="mt-0.5 font-mono text-xs font-semibold text-foreground">
                                        {formatDate(candidate.processed_at)}
                        </p>
                    </div>
                                <div className="rounded bg-muted p-2.5">
                                    <p className="text-[10px] font-medium text-muted-foreground">
                                        Flags Raised
                                    </p>
                                    <p className="mt-0.5 text-sm font-semibold text-foreground">
                                        {report.flags.length} flag
                                        {report.flags.length !== 1 ? 's' : ''}
                                    </p>
                    </div>
                                <div className="rounded bg-muted p-2.5">
                                    <p className="text-[10px] font-medium text-muted-foreground">
                                        Interview Rounds
                                    </p>
                                    <p className="mt-0.5 text-sm font-semibold text-foreground">
                                        {report.rounds.length}
                                </p>
                            </div>
                            </div>
                        </div>
                            </div>
                        </div>

                <div className="flex flex-col rounded-lg border border-border bg-card p-5">
                    <p className="mb-2 text-[10px] font-bold tracking-widest text-muted-foreground">
                        SIGNAL PROFILE
                    </p>
                    {isComplete ? (
                        <IntegrityRadarChart
                            data={report.radar}
                            className="flex flex-1 items-center"
                        />
                    ) : (
                        <div className="flex flex-1 items-center justify-center py-8 text-xs text-muted-foreground">
                            Available when screening completes
                                </div>
                    )}
                                </div>
                            </div>

            {!isComplete &&
                (candidate.status === 'failed' ? (
                    <div className="rounded-lg border border-border bg-card p-8 text-center">
                        <AlertTriangle
                            size={20}
                            className="mx-auto mb-2"
                            style={{ color: '#EF4444' }}
                        />
                        <p
                            className="text-sm font-semibold"
                            style={{ color: '#EF4444' }}
                        >
                            Screening failed
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                            {candidate.error_message ??
                                'The screening could not be completed.'}
                        </p>
                                                </div>
                ) : isOngoing ? (
                    <ScreeningProcessingStatus
                        startedAt={candidate.created_at}
                        poll
                    />
                ) : null)}

            {isComplete && (
                <>
                    {report.flags.length > 0 && (
                        <div
                            className="rounded-lg p-4"
                                                        style={{
                                background: 'rgba(239,68,68,0.05)',
                                border: '1px solid rgba(239,68,68,0.2)',
                            }}
                        >
                            <div className="mb-3 flex items-center gap-2">
                                <AlertCircle size={14} style={{ color: '#EF4444' }} />
                                <p
                                    className="text-sm font-semibold"
                                    style={{ color: '#EF4444' }}
                                >
                                    {report.flags.length} Active Flag
                                    {report.flags.length > 1 ? 's' : ''} Detected
                                </p>
                                                </div>
                            <div className="space-y-2">
                                {report.flags.map((flag, index) => (
                                    <div
                                        key={index}
                                        className="flex items-start gap-3 rounded p-2.5"
                                        style={{ background: 'rgba(0,0,0,0.2)' }}
                                    >
                                        <FlagBadge flag={flag} />
                                        <p
                                            className="flex-1 text-xs text-foreground"
                                        >
                                            {flag.description}
                                        </p>
                                        <span
                                            className="shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px] font-bold"
                                            style={{
                                                background:
                                                    'color-mix(in oklch, var(--chart-2) 15%, transparent)',
                                                color: 'var(--c-violet)',
                                            }}
                                        >
                                            {Math.round(flag.confidence * 100)}%
                                            conf.
                                        </span>
                                </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Tabs */}
                    <div>
                        <div
                            className="flex gap-0 border-b border-border"
                        >
                            {TABS.map((tab) => (
                                        <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold transition-all"
                                    style={{
                                        color:
                                            activeTab === tab
                                                ? 'var(--c-cyan)'
                                                : 'var(--c-muted)',
                                        borderBottom:
                                            activeTab === tab
                                                ? '2px solid var(--c-cyan)'
                                                : '2px solid transparent',
                                        marginBottom: -1,
                                    }}
                                >
                                    {TAB_ICONS[tab]}
                                    {tab}
                                        </button>
                                    ))}
                                </div>

                        <div className="pt-5">
                            {activeTab === 'CV Analysis' && (
                                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                                    <div className="space-y-4 lg:col-span-2">
                                        <Panel title="AI Text Detection Analysis">
                                            <div className="space-y-4">
                                                <MetricBar
                                                    label="Overall AI-generated text probability"
                                                    value={report.aiTextPercent}
                                                    invert
                                                />
                                                <MetricBar
                                                    label="Executive summary authenticity"
                                                    value={report.subScores.s_cv}
                                                />
                                                <MetricBar
                                                    label="Work experience narrative"
                                                    value={Math.max(
                                                        0,
                                                        report.subScores.s_cv - 6,
                                                    )}
                                                />
                                                <MetricBar
                                                    label="Skills section authenticity"
                                                    value={Math.min(
                                                        100,
                                                        report.subScores.s_cv + 8,
                                                    )}
                                                />
                                            </div>
                                            <div
                                                className="mt-4 rounded p-3 font-mono text-xs leading-relaxed"
                                                style={{
                                                    background:
                                                        'var(--c-surface-2)',
                                                    color: 'var(--c-muted)',
                                                    lineHeight: 1.8,
                                                }}
                                            >
                                                <span
                                                    style={{
                                                        color: 'var(--c-violet)',
                                                        fontSize: 10,
                                                        fontWeight: 700,
                                                    }}
                                                >
                                                    PARSER OUTPUT{' '}
                                            </span>
                                                <span style={{ fontSize: 10 }}>
                                                    → certalytic-nlp-classifier
                                                </span>
                                                <br />
                                                {report.componentSummaries.s_cv ||
                                                    'CV authorship analysis pending.'}
                                                {report.componentIndicators.s_cv
                                                    .length > 0 && (
                                                    <>
                                                        <br />
                                                        <br />
                                                        {report.componentIndicators.s_cv.map(
                                                            (indicator) => (
                                                                <span
                                                                    key={
                                                                        indicator
                                                                    }
                                                                >
                                                                    • {indicator}
                                                                    <br />
                                                                </span>
                                                            ),
                                                        )}
                                                    </>
                                                )}
                                        </div>
                                        </Panel>
                                    </div>

                                    <div className="space-y-4">
                                        <Panel title="CV Metrics">
                                            <InfoRow
                                                label="AI Text Probability"
                                                value={`${report.aiTextPercent}%`}
                                                mono
                                            />
                                            <InfoRow
                                                label="CV Authorship Score"
                                                value={report.subScores.s_cv}
                                                mono
                                            />
                                            <InfoRow
                                                label="Formatting Origin"
                                                value={
                                                    report.aiTextPercent > 40
                                                        ? 'Template (AI)'
                                                        : 'Manual'
                                                }
                                            />
                                            <InfoRow
                                                label="Language Model Match"
                                                value={
                                                    report.aiTextPercent > 40
                                                        ? 'GPT-class / Claude'
                                                        : 'None'
                                                }
                                            />
                                        </Panel>

                                        <Panel title="Risk Vectors">
                                            <ResponsiveContainer
                                                width="100%"
                                                height={130}
                                            >
                                                <BarChart
                                                    data={report.riskVectors}
                                                    layout="vertical"
                                                    margin={{
                                                        left: 0,
                                                        right: 10,
                                                    }}
                                                >
                                                    <XAxis
                                                        type="number"
                                                        domain={[0, 100]}
                                                        tick={{
                                                            fill: 'var(--muted-foreground)',
                                                            fontSize: 9,
                                                        }}
                                                        axisLine={false}
                                                        tickLine={false}
                                                    />
                                                    <YAxis
                                                        type="category"
                                                        dataKey="name"
                                                        tick={{
                                                            fill: 'var(--muted-foreground)',
                                                            fontSize: 9,
                                                        }}
                                                        axisLine={false}
                                                        tickLine={false}
                                                        width={65}
                                                    />
                                                    <Bar
                                                        dataKey="value"
                                                        radius={[0, 3, 3, 0]}
                                                    >
                                                        {report.riskVectors.map(
                                                            (entry) => (
                                                                <Cell
                                                                    key={
                                                                        entry.name
                                                                    }
                                                                    fill={
                                                                        entry.value >
                                                                        60
                                                                            ? '#EF4444'
                                                                            : entry.value >
                                                                                30
                                                                              ? '#F59E0B'
                                                                              : '#10B981'
                                                                    }
                                                                    fillOpacity={
                                                                        0.8
                                                                    }
                                                                />
                                                            ),
                                                        )}
                                                    </Bar>
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </Panel>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'Platform Cross-Ref' && (
                                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                                    <div className="space-y-4 lg:col-span-2">
                                        <Panel title="Platform Consistency Matrix">
                                            <div className="space-y-4">
                                                <MetricBar
                                                    label="LinkedIn ↔ CV employment match"
                                                    value={
                                                        report.platformMatrix
                                                            .linkedin_cv_match
                                                            .score
                                                    }
                                                    explanation={
                                                        report.platformMatrix
                                                            .linkedin_cv_match
                                                            .explanation
                                                    }
                                                />
                                                <MetricBar
                                                    label="GitHub activity ↔ claimed experience"
                                                    value={
                                                        report.platformMatrix
                                                            .github_experience_match
                                                            .score
                                                    }
                                                    explanation={
                                                        report.platformMatrix
                                                            .github_experience_match
                                                            .explanation
                                                    }
                                                />
                                                <MetricBar
                                                    label="Cross-platform name/date consistency"
                                                    value={
                                                        report.platformMatrix
                                                            .cross_platform_consistency
                                                            .score
                                                    }
                                                    explanation={
                                                        report.platformMatrix
                                                            .cross_platform_consistency
                                                            .explanation
                                                    }
                                                />
                                            </div>
                                            {report.componentSummaries.s_cross && (
                                                <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
                                                    {
                                                        report.componentSummaries
                                                            .s_cross
                                                    }
                                                </p>
                                            )}
                                        </Panel>

                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                            <Panel
                                                title="LinkedIn Analysis"
                                                icon={
                                                    <Rss
                                                        size={14}
                                                        style={{
                                                            color: 'var(--primary)',
                                                        }}
                                                    />
                                                }
                                            >
                                                {report.linkedin.provided ? (
                                                    <>
                                                        <InfoRow
                                                            label="Profile"
                                                            value="Provided"
                                                        />
                                                        <InfoRow
                                                            label="CV Consistency"
                                                            value={
                                                                report.platformConsistency !==
                                                                null
                                                                    ? `${report.platformConsistency}%`
                                                                    : 'Not evaluated'
                                                            }
                                                            mono
                                                        />
                                                        {candidate.linkedin_url && (
                                                            <a
                                                                href={
                                                                    candidate.linkedin_url
                                                                }
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="mt-2 block truncate text-[11px]"
                                                                style={{
                                                                    color: 'var(--c-cyan)',
                                                                }}
                                                            >
                                                                {
                                                                    candidate.linkedin_url
                                                                }
                                                            </a>
                                                        )}
                                                    </>
                                                ) : (
                                                    <p
                                                        className="py-2 text-xs"
                                                        style={{
                                                            color: 'var(--c-muted)',
                                                        }}
                                                    >
                                                        No LinkedIn profile
                                                        provided for cross-ref.
                                                    </p>
                                                )}
                                                <div className="mt-3">
                                                    <span
                                                        className="rounded px-2 py-1 text-[10px] font-bold"
                                                        style={{
                                                            background:
                                                                report.linkedin
                                                                    .status ===
                                                                'authentic'
                                                                    ? 'rgba(16,185,129,0.1)'
                                                                    : 'rgba(239,68,68,0.1)',
                                                            color:
                                                                report.linkedin
                                                                    .status ===
                                                                'authentic'
                                                                    ? '#10B981'
                                                                    : '#EF4444',
                                                        }}
                                                    >
                                                        {
                                                            report.linkedin
                                                                .statusLabel
                                                        }
                                                    </span>
                                    </div>
                                            </Panel>

                                            <Panel
                                                title="GitHub Analysis"
                                                icon={
                                                    <Code2
                                                        size={14}
                                                        style={{
                                                            color: 'var(--c-text)',
                                                        }}
                                                    />
                                                }
                                            >
                                                {report.github.provided ? (
                                                    <>
                                                        <InfoRow
                                                            label="Username"
                                                            value={
                                                                report.github
                                                                    .handle ?? '-'
                                                            }
                                                            mono
                                                        />
                                                        <InfoRow
                                                            label="Activity ↔ Experience"
                                                            value={
                                                                report.subScores.s_cross !==
                                                                null
                                                                    ? `${report.subScores.s_cross}%`
                                                                    : 'Not evaluated'
                                                            }
                                                            mono
                                                        />
                                                        {report.github
                                                            .handle && (
                                                            <a
                                                                href={`https://github.com/${report.github.handle}`}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="mt-2 block truncate text-[11px]"
                                                                style={{
                                                                    color: 'var(--c-cyan)',
                                                                }}
                                                            >
                                                                github.com/
                                                                {
                                                                    report.github
                                                                        .handle
                                                                }
                                                            </a>
                                                        )}
                                                    </>
                                                ) : (
                                                    <p
                                                        className="py-2 text-xs"
                                                        style={{
                                                            color: 'var(--c-muted)',
                                                        }}
                                                    >
                                                        No GitHub username
                                                        provided for cross-ref.
                                                    </p>
                                                )}
                                                <div className="mt-3">
                                                    <span
                                                        className="rounded px-2 py-1 text-[10px] font-bold"
                                                        style={{
                                                            background:
                                                                report.github
                                                                    .status ===
                                                                'authentic'
                                                                    ? 'rgba(16,185,129,0.1)'
                                                                    : 'rgba(239,68,68,0.1)',
                                                            color:
                                                                report.github
                                                                    .status ===
                                                                'authentic'
                                                                    ? '#10B981'
                                                                    : '#EF4444',
                                                        }}
                                                    >
                                                        {
                                                            report.github
                                                                .statusLabel
                                                        }
                                                    </span>
                                    </div>
                                            </Panel>
                                </div>
                            </div>

                                    <div className="space-y-4">
                                        <Panel title="Platform Summary">
                                            <InfoRow
                                                label="Overall Consistency"
                                                value={
                                                    report.platformConsistency !==
                                                    null
                                                        ? `${report.platformConsistency}%`
                                                        : 'Not evaluated'
                                                }
                                                mono
                                            />
                                            <InfoRow
                                                label="Sources Cross-Checked"
                                                value={
                                                    (report.linkedin.provided
                                                        ? 1
                                                        : 0) +
                                                    (report.github.provided
                                                        ? 1
                                                        : 0)
                                                }
                                                mono
                                            />
                                            <InfoRow
                                                label="LinkedIn"
                                                value={
                                                    report.linkedin.provided
                                                        ? 'Checked'
                                                        : 'Not provided'
                                                }
                                            />
                                            <InfoRow
                                                label="GitHub"
                                                value={
                                                    report.github.provided
                                                        ? 'Checked'
                                                        : 'Not provided'
                                                }
                                            />
                                        </Panel>
                                </div>
                                </div>
                            )}

                            {activeTab === 'Behaviour Analysis' && (
                                <SupplementaryAnalysisPanel
                                    title="Candidate behaviour analysis"
                                    analysis={report.behaviourAnalysis}
                                    indicatorLabel="Collaboration indicators"
                                />
                            )}

                            {activeTab === 'Personality Analysis' && (
                                <SupplementaryAnalysisPanel
                                    title="Candidate personality analysis"
                                    analysis={report.personalityAnalysis}
                                    indicatorLabel="Culture fit indicators"
                                    showMotivation
                                />
                            )}

                            {activeTab === 'Interview Analysis' && (
                                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                                    <div className="space-y-4 lg:col-span-2">
                                        {report.rounds.length === 0 ? (
                                            <Panel title="Interview Insights">
                                                <p
                                                    className="py-6 text-center text-sm"
                                                    style={{
                                                        color: 'var(--c-muted)',
                                                    }}
                                                >
                                                    No interview transcript recorded
                                                    for this candidate.
                                                </p>
                                            </Panel>
                                        ) : (
                                            report.rounds.map((round) => (
                                                <Panel
                                                    key={round.round_number}
                                                    title={`Round ${round.round_number} - What the analysis noticed`}
                                                    icon={
                                                        <Mic
                                                            size={14}
                                                            style={{
                                                                color: 'var(--c-cyan)',
                                                            }}
                                                        />
                                                    }
                                                >
                                                    <div className="mb-3 grid grid-cols-3 gap-3">
                                                        <div>
                                                            <p
                                                                className="text-[10px]"
                                                                style={{
                                                                    color: 'var(--c-muted)',
                                                                }}
                                                            >
                                                                Interview
                                                            </p>
                                                            <p
                                                                className="font-mono text-sm font-bold"
                                                                style={{
                                                                    color: 'var(--c-text)',
                                                                }}
                                                            >
                                                                {round.s_int ??
                                                                    '-'}
                                            </p>
                                        </div>
                                                        <div>
                                                            <p
                                                                className="text-[10px]"
                                                                style={{
                                                                    color: 'var(--c-muted)',
                                                                }}
                                                            >
                                                                Identity
                                                            </p>
                                                            <p
                                                                className="font-mono text-sm font-bold"
                                                                style={{
                                                                    color: 'var(--c-text)',
                                                                }}
                                                            >
                                                                {round.s_id ??
                                                                    '-'}
                                                            </p>
                                </div>
                                                        <div>
                                                            <p
                                                                className="text-[10px]"
                                                                style={{
                                                                    color: 'var(--c-muted)',
                                                                }}
                                                            >
                                                                Variance Δ
                                                            </p>
                                                            <p
                                                                className="font-mono text-sm font-bold"
                                                                style={{
                                                                    color: 'var(--c-text)',
                                                                }}
                                                            >
                                                                {round.variance_delta ??
                                                                    '-'}
                                                            </p>
                            </div>
                                    </div>
                                                    {round.was_truncated && (
                                                        <span
                                                            className="mb-2 inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold"
                                                            style={{
                                                                background:
                                                                    'rgba(245,158,11,0.12)',
                                                                color: '#F59E0B',
                                                            }}
                                                        >
                                                            <Scissors size={9} />
                                                            TRUNCATED
                                    </span>
                                                    )}
                                                    <ul className="space-y-1.5">
                                                        {round.observations.map(
                                                            (obs, index) => (
                                                                <li
                                                                    key={index}
                                                                    className="flex gap-2 text-xs leading-relaxed"
                                                                    style={{
                                                                        color: 'var(--c-muted)',
                                                                    }}
                                                                >
                                                                    <span
                                                                        style={{
                                                                            color: 'var(--c-cyan)',
                                                                        }}
                                                                    >
                                                                        •
                                                                    </span>
                                                                    {obs}
                                                                </li>
                                                            ),
                                                        )}
                                                    </ul>
                                                    {round.deep_dive_prompts
                                                        .length > 0 && (
                                                        <div
                                                            className="mt-3 space-y-1.5 border-t pt-3"
                                                            style={{
                                                                borderColor:
                                                                    'var(--c-border)',
                                                            }}
                                                        >
                                                            <p
                                                                className="text-[10px] font-bold tracking-widest"
                                                                style={{
                                                                    color: 'var(--c-muted)',
                                                                }}
                                                            >
                                                                SUGGESTED
                                                                DEEP-DIVE PROMPTS
                                                            </p>
                                                            {round.deep_dive_prompts.map(
                                                                (
                                                                    prompt,
                                                                    index,
                                                                ) => (
                                                                    <p
                                                                        key={
                                                                            index
                                                                        }
                                                                        className="text-xs leading-relaxed"
                                                                        style={{
                                                                            color: 'var(--c-muted)',
                                                                        }}
                                                                    >
                                                                        {prompt}
                                                                    </p>
                                                                ),
                                                            )}
                                </div>
                                                    )}
                                                </Panel>
                                            ))
                                        )}
                                </div>

                                    <div className="space-y-4">
                                        <Panel title="Interview Metrics">
                                            <InfoRow
                                                label="Rounds Recorded"
                                                value={report.rounds.length}
                                                mono
                                            />
                                            <InfoRow
                                                label="Truncated Rounds"
                                                value={
                                                    report.rounds.filter(
                                                        (r) => r.was_truncated,
                                                    ).length
                                                }
                                                mono
                                            />
                                            <InfoRow
                                                label="Confidence Variance"
                                                value={`${report.interviewVariance}%`}
                                                mono
                                            />
                                            <InfoRow
                                                label="Prompt Injection Risk"
                                                value={
                                                    report.interviewVariance > 40
                                                        ? 'Elevated'
                                                        : 'Low'
                                                }
                                            />
                                        </Panel>
                            </div>
                        </div>
                            )}

                            {activeTab === 'Signal Summary' && (
                                <div className="space-y-4">
                                    <DecisionSupportDisclaimer
                                        variant="subtle"
                                        className="max-w-xl"
                                    />
                                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                                    <Panel
                                        title="Certalytic Intelligence Summary"
                                        icon={
                                            <Brain
                                                size={14}
                                                style={{
                                                    color: 'var(--c-violet)',
                                                }}
                                            />
                                        }
                                    >
                                        <div
                                            className="rounded p-3 font-mono text-xs leading-relaxed"
                                            style={{
                                                background: 'var(--c-surface-2)',
                                                color: 'var(--c-muted)',
                                            }}
                                        >
                                            <p
                                                style={{
                                                    fontWeight: 700,
                                                    fontSize: 12,
                                                    color:
                                                        report.level === 'high'
                                                            ? '#10B981'
                                                            : report.level ===
                                                                'medium'
                                                              ? '#F59E0B'
                                                              : '#EF4444',
                                                }}
                                            >
                                                {report.verdict.title}
                                            </p>
                                            <p className="mt-2">
                                                {report.verdict.body}
                                            </p>
                        </div>
                                    </Panel>

                                    <div className="space-y-4">
                                        {showFullBreakdown && (
                                            <Panel title="Signal Vector Scores">
                                                <div className="space-y-3">
                                                    {report.radar.map(
                                                        ({ subject, value }) => (
                                                            <MetricBar
                                                                key={subject}
                                                                label={subject}
                                                                value={value}
                                                            />
                                                        ),
                                                    )}
                                                </div>
                                            </Panel>
                                        )}
                                        <Panel title="Suggested Follow-ups">
                                            <div className="space-y-2">
                                                {report.recommendedActions.map(
                                                    (action, index) => (
                                                        <div
                                                            key={index}
                                                            className="flex items-start gap-2"
                                                        >
                                                            {report.level ===
                                                            'high' ? (
                                                                <CheckCircle2
                                                                    size={12}
                                                                    className="mt-0.5 shrink-0"
                                                                    style={{
                                                                        color: '#10B981',
                                                                    }}
                                                                />
                                                            ) : report.level ===
                                                              'medium' ? (
                                                                <AlertCircle
                                                                    size={12}
                                                                    className="mt-0.5 shrink-0"
                                                                    style={{
                                                                        color: '#F59E0B',
                                                                    }}
                                                                />
                                                            ) : (
                                                                <XCircle
                                                                    size={12}
                                                                    className="mt-0.5 shrink-0"
                                                                    style={{
                                                                        color: '#EF4444',
                                                                    }}
                                                                />
                                                            )}
                                                            <p
                                                                className="text-xs"
                                                                style={{
                                                                    color: 'var(--c-muted)',
                                                                }}
                                                            >
                                                                {action}
                                                            </p>
                                                        </div>
                                                    ),
                                                )}
                                            </div>
                                        </Panel>
                                    </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

CandidateShow.layout = (props: {
    currentTeam?: { slug: string } | null;
    candidate: { id: number; name: string };
}) => ({
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
        {
            title: props.candidate.name,
            href: props.currentTeam
                ? screeningShow.url([
                      props.currentTeam.slug,
                      props.candidate.id,
                  ])
                : '/',
        },
    ],
});
