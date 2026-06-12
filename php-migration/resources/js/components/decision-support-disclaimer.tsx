import { MessageCircleWarning } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from './ui/alert';

type DecisionSupportDisclaimerProps = {
    message?: string;
    className?: string;
    variant?: 'prominent' | 'subtle';
};

export default function DecisionSupportDisclaimer({
    message = 'This score represents a probability heuristic, not an absolute verdict. Use it to guide your human follow-up questions.',
    className,
    variant = 'prominent',
}: DecisionSupportDisclaimerProps) {
    return (
        <Alert
            variant="default"
            className={cn(
                'border-amber-500/45 bg-amber-500/10 text-amber-950 dark:text-amber-50',
                variant === 'subtle' && 'mt-0 bg-amber-500/8',
                className,
            )}
        >
            <MessageCircleWarning
                size={13}
                className="shrink-0 text-amber-700 dark:text-amber-300"
            />
            <AlertDescription className="text-amber-950 dark:text-amber-50/95">
                {message}
            </AlertDescription>
        </Alert>
    );
}
