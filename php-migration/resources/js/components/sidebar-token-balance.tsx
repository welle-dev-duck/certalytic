import { Link, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { index as billingIndex } from '@/routes/billing';
import type { TokenUsage } from '@/types/candidates';

export default function SidebarTokenBalance() {
    const { currentTeam, tokenUsage } = usePage<{
        tokenUsage: TokenUsage | null;
    }>().props;

    if (!currentTeam || !tokenUsage) {
        return null;
    }

    return (
        <div className="px-3 pb-4">
            <div className="rounded-lg bg-surface-container-high p-4">
                <p className="text-label-md font-semibold tracking-widest text-muted-foreground uppercase">
                    Token balance
                </p>
                <p className="mt-2 text-headline-md font-semibold text-foreground tabular-nums">
                    {tokenUsage.available}
                    <span className="text-muted-foreground">
                        /{tokenUsage.included_quota + tokenUsage.pack_balance}
                    </span>
                </p>
                <Button
                    variant="default"
                    size="sm"
                    className="mt-3 w-full"
                    asChild
                >
                    <Link href={billingIndex(currentTeam.slug)}>Refill tokens</Link>
                </Button>
            </div>
        </div>
    );
}
