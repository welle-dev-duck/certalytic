import { cn } from '@/lib/utils';

type ConfidenceBarProps = {
    score: number | string | null;
    className?: string;
    segmentClassName?: string;
};

function normalizeScore(score: number | string | null): number | null {
    if (score === null || score === '' || score === '-') {
        return null;
    }

    const value = typeof score === 'string' ? Number.parseFloat(score) : score;

    if (Number.isNaN(value)) {
        return null;
    }

    return Math.max(0, Math.min(100, value));
}

export default function ConfidenceBar({
    score,
    className,
    segmentClassName,
}: ConfidenceBarProps) {
    const value = normalizeScore(score);
    const filledSegments =
        value === null ? 0 : Math.max(1, Math.round((value / 100) * 5));

    return (
        <div className={cn('flex w-24 gap-0.5', className)}>
            {Array.from({ length: 5 }).map((_, index) => (
                <div
                    key={index}
                    className={cn(
                        'confidence-bar-segment',
                        value !== null && index < filledSegments
                            ? 'bg-integrity'
                            : 'bg-surface-container-high',
                        segmentClassName,
                    )}
                />
            ))}
        </div>
    );
}
