import { Link } from '@inertiajs/react';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import DataPrivacyPanel from '@/components/marketing/data-privacy-panel';
import { Button } from '@/components/ui/button';

const trustPoints = [
    'Certalytic is EU-based and GDPR-compliant',
    'EU-only storage & inference path',
    'Decision support - not automated hiring',
    'Candidate data is kept and processed within EU based infrastructure',
    'Transcription audio is deleted after transcription completes',
];

export default function MarketingEuPrivacySection() {
    return (
        <section
            id="privacy"
            className="relative overflow-hidden border-y border-primary/20 bg-gradient-to-b from-primary/10 via-background to-background py-24 md:min-h-[72vh] md:py-32"
        >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,color-mix(in_oklch,var(--primary)_18%,transparent),transparent_55%)]" />

            <div className="relative mx-auto max-w-6xl px-6">
                <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
                    <div>
                        <div className="flex items-center gap-2 text-primary">
                            <ShieldCheck size={22} />
                            <span className="text-xs font-bold tracking-[0.2em] uppercase">
                                The only GDPR-sovereign interview intelligence layer
                            </span>
                        </div>
                        <h2 className="mt-6 font-serif text-4xl leading-[1.08] tracking-tight md:text-5xl lg:text-6xl">
                            Your candidates&apos; data never leaves{' '}
                            <span className="text-primary">
                                EU jurisdiction.
                            </span>
                        </h2>
                        <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
                            In Europe, candidate audio and CVs cannot route through US
                            cloud LLMs. Certalytic processes exclusively on EU soil -
                            the compliance moat that disqualifies American competitors
                            from your senior hiring pipeline.
                        </p>

                        <ul className="mt-10 grid gap-3 sm:grid-cols-2">
                            {trustPoints.map((item) => (
                                <li
                                    key={item}
                                    className="flex items-start gap-2.5 text-sm text-muted-foreground"
                                >
                                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                                    {item}
                                </li>
                            ))}
                        </ul>

                        <div className="mt-10 flex flex-wrap gap-3">
                            <Button variant="default" size="sm" asChild>
                                <Link href="/legal/privacy">
                                    Privacy Policy
                                    <ArrowRight size={14} />
                                </Link>
                            </Button>
                            <Button variant="outline" size="sm" asChild>
                                <Link href="/legal/dpa">DPA</Link>
                            </Button>
                            <Button variant="outline" size="sm" asChild>
                                <Link href="/legal/imprint">Imprint</Link>
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <DataPrivacyPanel
                            prominent
                            className="border-primary/25 bg-card/90 shadow-sm"
                        />
                        <div className="grid grid-cols-3 gap-3 text-center">
                            {[
                                { label: 'Hetzner', sub: 'DE / FI' },
                                { label: 'Mistral', sub: 'Paris' },
                                { label: 'Stripe', sub: 'Billing only' },
                            ].map((item) => (
                                <div
                                    key={item.label}
                                    className="border border-border bg-card/80 px-3 py-4"
                                >
                                    <p className="text-sm font-semibold text-foreground">
                                        {item.label}
                                    </p>
                                    <p className="mt-1 text-[10px] tracking-wide text-muted-foreground uppercase">
                                        {item.sub}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
