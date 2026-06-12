import { Head, router, usePage } from '@inertiajs/react';
import { AlertTriangle, Check, Zap } from 'lucide-react';
import { useState } from 'react';
import {
    portal,
    purchasePack,
    subscribe,
} from '@/actions/App/Http/Controllers/Billing/BillingController';
import { Button } from '@/components/ui/button';
import type { TokenUsage } from '@/types/candidates';
import { dashboard as dashboardRoute } from '@/routes';
import { index as billingIndex } from '@/routes/billing';

type PlanCard = {
    value: string;
    label: string;
    price: number | null;
    tokens: number;
    seats: number;
    features: string[];
    incremental_features: string[];
    includes_plan: string | null;
};

type Props = {
    tokenUsage: TokenUsage;
    currentPlan: { value: string; label: string; price: number | null };
    plans: PlanCard[];
    freePlanFeatures: string[];
    enterprisePlan: { label: string; features: string[] };
    contactEmail: string;
    tokenPacks: { key: string; name: string; tokens: number; price: number }[];
    canPurchasePacks: boolean;
    hasIncompletePayment: boolean;
    paymentMethod: { type: string | null; last_four: string | null };
};

function SectionHeader({ label }: { label: string }) {
    return (
        <p className="mb-4 text-[10px] font-bold tracking-widest text-muted-foreground">
            {label}
        </p>
    );
}

export default function BillingPage({
    tokenUsage,
    currentPlan,
    plans,
    enterprisePlan,
    contactEmail,
    tokenPacks,
    canPurchasePacks,
    hasIncompletePayment,
    paymentMethod,
}: Props) {
    const { currentTeam } = usePage().props;
    const teamSlug = currentTeam?.slug ?? '';
    const [pending, setPending] = useState<string | null>(null);

    const used = tokenUsage.included_used;
    const quota = tokenUsage.included_quota;
    const tokenPct = quota > 0 ? Math.round((used / quota) * 100) : 0;

    const switchPlan = (value: string) => {
        setPending(value);
        router.post(
            subscribe.url(teamSlug),
            { plan: value },
            { onFinish: () => setPending(null) },
        );
    };

    const buyPack = (key: string) => {
        setPending(key);
        router.post(
            purchasePack.url(teamSlug),
            { pack: key },
            { onFinish: () => setPending(null) },
        );
    };

    return (
        <div className="space-y-8 p-6">
            <Head title="Billing" />
            <div>
                <h1 className="text-xl font-bold text-foreground">Billing</h1>
                <p className="mt-0.5 text-sm text-muted-foreground">
                    Token usage, plans, and add-on packs
                </p>
            </div>

            {hasIncompletePayment && (
                <div
                    className="flex items-center gap-2 rounded-lg p-3 text-xs"
                    style={{
                        background: 'rgba(245,158,11,0.08)',
                        border: '1px solid rgba(245,158,11,0.3)',
                        color: '#F59E0B',
                    }}
                >
                    <AlertTriangle size={14} />
                    You have an incomplete payment. Use “Manage Billing” to
                    resolve it.
                </div>
            )}

            <section>
                <SectionHeader label="TOKEN USAGE" />
                <div className="space-y-3 rounded-lg border border-border bg-card p-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                            <Zap size={13} className="text-primary" />
                            <p className="text-xs font-semibold text-foreground">
                                Included tokens this period
                            </p>
                        </div>
                        <p className="font-mono text-xs font-bold text-foreground">
                            {used}{' '}
                            <span className="text-muted-foreground">
                                / {quota}
                            </span>
                        </p>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-border">
                        <div
                            className="h-full rounded-full transition-all"
                            style={{
                                width: `${Math.min(100, tokenPct)}%`,
                                background:
                                    tokenPct > 85
                                        ? '#EF4444'
                                        : tokenPct > 65
                                          ? '#F59E0B'
                                          : 'var(--primary)',
                            }}
                        />
                    </div>
                    <div className="flex justify-between">
                        <p className="text-[10px] text-muted-foreground">
                            {tokenUsage.included_remaining} included tokens
                            remaining · {tokenUsage.available} available now
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                            {tokenPct}% used
                        </p>
                    </div>
                    {tokenUsage.pack_balance > 0 && (
                        <p className="text-[10px] text-primary">
                            +{tokenUsage.pack_balance} pack balance active
                        </p>
                    )}
                    {paymentMethod.last_four && (
                        <p className="text-[10px] text-muted-foreground">
                            Payment method: •••• {paymentMethod.last_four}
                        </p>
                    )}
                </div>
            </section>

            <section>
                <SectionHeader label="PLANS" />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
                    {plans.map((plan) => {
                        const isCurrent = plan.value === currentPlan.value;
                        const displayFeatures =
                            plan.includes_plan !== null
                                ? plan.incremental_features
                                : plan.features;

                        return (
                            <div
                                key={plan.value}
                                className="flex flex-col gap-4 rounded-lg border p-5"
                                style={{
                                    background: isCurrent
                                        ? 'color-mix(in oklch, var(--primary) 7%, transparent)'
                                        : 'var(--c-surface)',
                                    borderColor: isCurrent
                                        ? 'color-mix(in oklch, var(--primary) 35%, transparent)'
                                        : 'var(--c-border)',
                                }}
                            >
                                <div>
                                    <div className="mb-1 flex items-center gap-2">
                                        <p
                                            className="text-sm font-bold"
                                            style={{
                                                color: isCurrent
                                                    ? 'var(--c-cyan)'
                                                    : 'var(--c-text)',
                                            }}
                                        >
                                            {plan.label}
                                        </p>
                                        {isCurrent && (
                                            <span
                                                className="rounded px-2 py-0.5 text-[10px] font-bold tracking-wide"
                                                style={{
                                                    background:
                                                        'color-mix(in oklch, var(--primary) 15%, transparent)',
                                                    color: 'var(--c-cyan)',
                                                    border: '1px solid color-mix(in oklch, var(--primary) 30%, transparent)',
                                                }}
                                            >
                                                CURRENT
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-2xl font-bold tabular-nums text-foreground">
                                        {plan.price === null
                                            ? 'Custom'
                                            : `€${plan.price}`}
                                        {plan.price !== null && (
                                            <span className="text-sm font-normal text-muted-foreground">
                                                /mo
                                            </span>
                                        )}
                                    </p>
                                </div>

                                <div className="space-y-1 text-xs text-muted-foreground">
                                    <p>
                                        {plan.seats} seat
                                        {plan.seats !== 1 ? 's' : ''} included
                                    </p>
                                    <p>{plan.tokens} screenings / month</p>
                                </div>

                                <div className="space-y-1.5">
                                    {plan.includes_plan !== null && (
                                        <p className="text-xs font-semibold text-foreground">
                                            Everything in {plan.includes_plan},
                                            plus:
                                        </p>
                                    )}
                                    {displayFeatures.map((feature) => (
                                        <div
                                            key={feature}
                                            className="flex items-start gap-2"
                                        >
                                            <Check
                                                size={12}
                                                className="mt-0.5 shrink-0 text-[#10B981]"
                                            />
                                            <span className="text-xs text-foreground">
                                                {feature}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                {isCurrent ? (
                                    <Button
                                        className="mt-auto w-full cursor-pointer"
                                        variant="default"
                                        onClick={() =>
                                            router.get(portal.url(teamSlug))
                                        }
                                    >
                                        Manage Billing
                                    </Button>
                                ) : (
                                    <Button
                                        className="mt-auto w-full cursor-pointer"
                                        variant="outline"
                                        disabled={pending !== null}
                                        onClick={() => switchPlan(plan.value)}
                                    >
                                        {pending === plan.value
                                            ? 'Redirecting…'
                                            : 'Switch plan'}
                                    </Button>
                                )}
                            </div>
                        );
                    })}

                    <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-5">
                        <div>
                            <p className="text-sm font-bold text-foreground">
                                {enterprisePlan.label}
                            </p>
                            <p className="mt-1 text-2xl font-bold text-foreground">
                                Custom
                            </p>
                        </div>
                        <div className="space-y-1 text-xs text-muted-foreground">
                            <p>Unlimited seats & tokens</p>
                            <p>Tailored for large hiring teams</p>
                        </div>
                        <div className="space-y-1.5">
                            {enterprisePlan.features.map((feature) => (
                                <div
                                    key={feature}
                                    className="flex items-start gap-2"
                                >
                                    <Check
                                        size={12}
                                        className="mt-0.5 shrink-0 text-[#10B981]"
                                    />
                                    <span className="text-xs text-foreground">
                                        {feature}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <Button
                            asChild
                            className="mt-auto w-full cursor-pointer"
                            variant="outline"
                        >
                            <a href={`mailto:${contactEmail}?subject=Enterprise%20plan%20inquiry`}>
                                Contact us
                            </a>
                        </Button>
                    </div>
                </div>
            </section>

            <section>
                <SectionHeader label="TOKEN PACKS" />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {tokenPacks.map((pack) => {
                        const perToken = (pack.price / pack.tokens).toFixed(2);

                        return (
                            <div
                                key={pack.key}
                                className="rounded-lg border border-border bg-card p-4"
                            >
                                <div className="mb-3 flex items-start justify-between">
                                    <div>
                                        <p className="text-xs font-bold text-foreground">
                                            {pack.name}
                                        </p>
                                        <p className="mt-0.5 text-[10px] text-muted-foreground">
                                            {pack.tokens} screenings · €{perToken}
                                            /screening
                                        </p>
                                    </div>
                                    <p className="text-lg font-bold text-foreground">
                                        €{pack.price}
                                    </p>
                                </div>
                                {canPurchasePacks ? (
                                    <Button
                                        className="w-full cursor-pointer"
                                        variant="outline"
                                        size="sm"
                                        disabled={pending !== null}
                                        onClick={() => buyPack(pack.key)}
                                    >
                                        {pending === pack.key
                                            ? 'Redirecting…'
                                            : `Purchase`}
                                    </Button>
                                ) : (
                                    <p className="text-[10px] text-muted-foreground">
                                        Upgrade to a paid plan to purchase token
                                        packs
                                    </p>
                                )}
                            </div>
                        );
                    })}
                </div>
            </section>
        </div>
    );
}

BillingPage.layout = (props: { currentTeam?: { slug: string } | null }) => ({
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: props.currentTeam
                ? dashboardRoute.url(props.currentTeam.slug)
                : '/',
        },
        {
            title: 'Billing',
            href: props.currentTeam
                ? billingIndex(props.currentTeam.slug).url
                : '/',
        },
    ],
});
