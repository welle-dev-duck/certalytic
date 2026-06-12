import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type Props = {
    label: string;
    value: ReactNode;
    hint?: string;
    icon?: LucideIcon;
    action?: ReactNode;
    className?: string;
};

export default function StatCard({
    label,
    value,
    hint,
    icon: Icon,
    action,
    className,
}: Props) {
    return (
        <Card className={cn('gap-0 py-0', className)}>
            <CardContent className="flex flex-col gap-4 px-5 py-5">
                <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            {label}
                        </p>
                        <div className="font-display text-3xl font-semibold tracking-tight tabular-nums">
                            {value}
                        </div>
                    </div>
                    {Icon ? (
                        <div className="flex size-9 items-center justify-center rounded-sm bg-brand-muted text-brand">
                            <Icon className="size-4" />
                        </div>
                    ) : null}
                </div>
                {hint ? (
                    <p className="text-sm leading-relaxed text-muted-foreground">{hint}</p>
                ) : null}
                {action}
            </CardContent>
        </Card>
    );
}
