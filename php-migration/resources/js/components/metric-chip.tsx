import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Props = {
    label: string;
    value: ReactNode;
    detail?: string;
    className?: string;
};

export default function MetricChip({ label, value, detail, className }: Props) {
    return (
        <div
            className={cn(
                'min-w-[140px] flex-1 rounded-sm border border-border/80 bg-card px-4 py-3 shadow-xs',
                className,
            )}
        >
            <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                {label}
            </p>
            <p className="mt-1 font-display text-2xl font-semibold tracking-tight tabular-nums">
                {value}
            </p>
            {detail ? (
                <p className="mt-0.5 text-xs text-muted-foreground">{detail}</p>
            ) : null}
        </div>
    );
}
