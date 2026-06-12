import { Link, usePage } from '@inertiajs/react';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { MarketingPricingPlan } from '@/types/marketing';
import { register } from '@/routes';

function PlanCard({
    plan,
    contactEmail,
}: {
    plan: MarketingPricingPlan;
    contactEmail?: string;
}) {
    const isEnterprise = plan.value === 'enterprise';

    return (
        <div
            className={`flex flex-col border p-6 ${
                plan.highlighted
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-border bg-card'
            }`}
        >
            <div>
                <p className="text-sm font-bold text-foreground">{plan.label}</p>
                <p className="mt-2 font-serif text-3xl tabular-nums text-foreground">
                    {plan.price === null ? (
                        'Custom'
                    ) : plan.price === 0 ? (
                        'Free'
                    ) : (
                        <>
                            €{plan.price}
                            <span className="text-sm font-sans font-normal text-muted-foreground">
                                /mo
                            </span>
                        </>
                    )}
                </p>
            </div>

            {plan.tokens !== null && (
                <p className="mt-3 text-xs text-muted-foreground">
                    {plan.tokens} screenings / month · {plan.seats} seat
                    {plan.seats !== 1 ? 's' : ''}
                </p>
            )}

            <ul className="mt-5 flex-1 space-y-2">
                {plan.features.map((feature) => (
                    <li
                        key={feature}
                        className="flex items-start gap-2 text-xs text-foreground"
                    >
                        <Check
                            size={12}
                            className="mt-0.5 shrink-0 text-[#10B981]"
                        />
                        {feature}
                    </li>
                ))}
            </ul>

            <Button
                className="mt-6 w-full"
                variant={plan.highlighted ? 'default' : 'outline'}
                asChild
            >
                {isEnterprise ? (
                    <a href={`mailto:${contactEmail}?subject=Certalytic%20Enterprise`}>
                        Contact sales
                    </a>
                ) : (
                    <Link href={register()}>Get started</Link>
                )}
            </Button>
        </div>
    );
}

export default function MarketingPricingSection() {
    const { marketing, company } = usePage().props;
    const { pricing } = marketing;

    const enterprisePlan: MarketingPricingPlan = {
        value: 'enterprise',
        label: pricing.enterprise.label,
        price: null,
        tokens: null,
        seats: 6,
        features: pricing.enterprise.features,
    };

    return (
        <section id="pricing" className="border-y border-border py-20 md:py-24">
            <div className="mx-auto max-w-6xl px-6">
                <div className="mb-10 max-w-2xl">
                    <h2 className="font-serif text-3xl tracking-tight md:text-4xl">
                        Pricing that pays for itself on the first prevented mistake
                    </h2>
                    <p className="mt-3 text-muted-foreground">
                        Three free dossiers to start. Scale to agency volume or
                        mandate team-wide checkpoints- a fraction of one mis-hire.
                    </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {pricing.plans.map((plan) => (
                        <PlanCard key={plan.value} plan={plan} />
                    ))}
                    <PlanCard
                        plan={enterprisePlan}
                        contactEmail={company.email}
                    />
                </div>
            </div>
        </section>
    );
}
