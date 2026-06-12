import ConfidenceBar from '@/components/confidence-bar';
import DecisionSupportDisclaimer from '@/components/decision-support-disclaimer';
import { Alert, AlertDescription } from '@/components/ui/alert';

type ComponentScore = {
    score: number | null;
    summary: string;
    indicators?: string[];
    confidence_band?: string;
};

type ScoreBreakdown = {
    s_cv: ComponentScore;
    s_int: ComponentScore;
    s_cross: ComponentScore;
    s_id: ComponentScore;
};

type Props = {
    score: number | string | null;
    breakdown?: ScoreBreakdown | null;
    showFullBreakdown: boolean;
    highInconsistencyWarning?: boolean;
};

const componentLabels: Record<keyof ScoreBreakdown, string> = {
    s_cv: 'CV authenticity',
    s_int: 'Interview behavioral',
    s_cross: 'Cross-source consistency',
    s_id: 'Identity confidence',
};

export default function IntegrityScoreCard({
    score,
    breakdown,
    showFullBreakdown,
    highInconsistencyWarning = false,
}: Props) {
    const numericScore =
        score === null || score === ''
            ? null
            : Number.parseFloat(String(score));

    return (
        <div className="space-y-8">
            <DecisionSupportDisclaimer />

            {highInconsistencyWarning ? (
                <Alert className="rounded-lg border-amber-500/40 bg-amber-500/5">
                    <AlertDescription className="leading-relaxed">
                        High inconsistency flagged between interview rounds. Signal
                        density shifted beyond expected variance - follow-up
                        suggested.
                    </AlertDescription>
                </Alert>
            ) : null}

            <div className="grid grid-cols-1 gap-gutter lg:grid-cols-12">
                <div className="flex min-h-[320px] flex-col items-center justify-center rounded-lg border border-border bg-card p-8 lg:col-span-5">
                    <div className="mb-6 text-center">
                        <h3 className="text-label-md font-semibold tracking-widest text-muted-foreground uppercase">
                            Composite integrity score
                        </h3>
                    </div>
                    <div className="flex flex-col items-center gap-4">
                        <span className="font-mono-data text-6xl font-bold text-primary tabular-nums">
                            {score ?? '-'}
                        </span>
                        <ConfidenceBar score={score} className="w-32" />
                        {numericScore !== null && !Number.isNaN(numericScore) ? (
                            <p className="text-label-md text-muted-foreground">
                                Confidence level:{' '}
                                {Math.max(1, Math.round((numericScore / 100) * 5))}
                                /5
                            </p>
                        ) : null}
                    </div>
                </div>

                <div className="rounded-lg border border-border bg-card p-8 lg:col-span-7">
                    <h3 className="text-headline-md mb-8 font-semibold text-primary">
                        Metric weights & analysis
                    </h3>

                    {showFullBreakdown && breakdown ? (
                        <div className="space-y-8">
                            {(Object.keys(componentLabels) as Array<
                                keyof ScoreBreakdown
                            >).map((key) => (
                                <MetricBar
                                    key={key}
                                    label={componentLabels[key]}
                                    data={breakdown[key]}
                                />
                            ))}
                        </div>
                    ) : (
                        <p className="text-body-sm leading-relaxed text-muted-foreground">
                            Upgrade to Starter for a full integrity indicator
                            breakdown.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

function MetricBar({
    label,
    data,
}: {
    label: string;
    data: ComponentScore;
}) {
    return (
        <div>
            <div className="mb-2 flex justify-between">
                <span className="text-label-md font-semibold tracking-wide text-muted-foreground uppercase">
                    {label}
                </span>
                <span className="font-mono-data text-body-sm tabular-nums">
                    {data.score !== null ? `${data.score}/100` : 'Not evaluated'}
                </span>
            </div>
            <div className="h-1 w-full rounded bg-muted">
                {data.score !== null ? (
                    <div
                        className="h-1 rounded bg-primary"
                        style={{ width: `${data.score}%` }}
                    />
                ) : null}
            </div>
            <p className="mt-2 text-body-sm text-muted-foreground">
                {data.summary}
            </p>
        </div>
    );
}
