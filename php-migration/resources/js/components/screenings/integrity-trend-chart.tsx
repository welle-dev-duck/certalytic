import { Link } from '@inertiajs/react';
import { cn } from '@/lib/utils';
import { show } from '@/routes/candidates';

export type ScreeningChartPoint = {
    id: number;
    name: string;
    role: string | null;
    integrity_score: number;
    processed_at: string | null;
};

type Props = {
    screenings: ScreeningChartPoint[];
    teamSlug: string;
};

function scoreTone(score: number): string {
    if (score >= 75) {
        return 'bg-brand';
    }

    if (score >= 55) {
        return 'bg-amber-500';
    }

    return 'bg-rose-500';
}

function formatShortDate(iso: string | null): string {
    if (!iso) {
        return '';
    }

    return new Intl.DateTimeFormat(undefined, {
        month: 'short',
        day: 'numeric',
    }).format(new Date(iso));
}

export default function IntegrityTrendChart({ screenings, teamSlug }: Props) {
    if (screenings.length === 0) {
        return (
            <div className="flex h-52 items-center justify-center rounded-sm border border-dashed border-border/80 bg-muted/15 px-6 text-center">
                <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
                    Completed screenings will appear here with integrity scores.
                </p>
            </div>
        );
    }

    const ordered = [...screenings].reverse();

    return (
        <div className="space-y-4">
            <div className="relative h-52 pl-8">
                <div className="pointer-events-none absolute inset-0 grid grid-rows-4">
                    {[100, 75, 50, 25].map((tick) => (
                        <div
                            key={tick}
                            className="relative border-t border-border/50 first:border-transparent"
                        >
                            <span className="absolute -left-7 -translate-y-1/2 text-[10px] tabular-nums text-muted-foreground/70">
                                {tick}
                            </span>
                        </div>
                    ))}
                </div>

                <div className="absolute inset-0 flex items-end gap-2 pb-1">
                    {ordered.map((screening) => (
                        <Link
                            key={screening.id}
                            href={show([teamSlug, screening.id])}
                            className="group flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2"
                            title={`${screening.name} · ${screening.integrity_score}`}
                        >
                            <span className="font-display text-[11px] font-semibold tabular-nums opacity-0 transition-opacity group-hover:opacity-100">
                                {screening.integrity_score}
                            </span>
                            <div className="flex h-[calc(100%-2.5rem)] w-full max-w-10 items-end justify-center">
                                <div
                                    className={cn(
                                        'w-full max-w-8 rounded-t-sm transition-transform group-hover:scale-x-105',
                                        scoreTone(screening.integrity_score),
                                    )}
                                    style={{
                                        height: `${Math.max(12, screening.integrity_score)}%`,
                                    }}
                                />
                            </div>
                            <div className="w-full shrink-0 text-center">
                                <p className="truncate text-[10px] font-medium">
                                    {screening.name.split(' ')[0]}
                                </p>
                                <p className="text-[10px] text-muted-foreground">
                                    {formatShortDate(screening.processed_at)}
                                </p>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            <div className="flex flex-wrap gap-4 text-[11px] text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                    <span className="size-2 rounded-sm bg-brand" />
                    75+
                </span>
                <span className="inline-flex items-center gap-1.5">
                    <span className="size-2 rounded-sm bg-amber-500" />
                    55–74
                </span>
                <span className="inline-flex items-center gap-1.5">
                    <span className="size-2 rounded-sm bg-rose-500" />
                    &lt;55
                </span>
            </div>
        </div>
    );
}
