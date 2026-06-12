import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';
import MarketingEuPrivacySection from '@/components/marketing/marketing-eu-privacy-section';
import MarketingFeaturesBento from '@/components/marketing/marketing-features-bento';
import MarketingPageShell from '@/components/marketing/marketing-page-shell';
import MarketingPricingSection from '@/components/marketing/marketing-pricing-section';
import MarketingProcessSection from '@/components/marketing/marketing-process-section';
import MarketingReviewsSection from '@/components/marketing/marketing-reviews-section';
import MarketingRoadmapSection from '@/components/marketing/marketing-roadmap-section';
import MarketingScreeningPreview from '@/components/marketing/marketing-screening-preview';
import MarketingStatsSection from '@/components/marketing/marketing-stats-section';
import { Button } from '@/components/ui/button';
import { dashboard, login } from '@/routes';
import { register } from '@/routes';

export default function Welcome() {
    const { auth, currentTeam, company } = usePage().props;
    const dashboardUrl = currentTeam ? dashboard(currentTeam.slug) : '/';
    const contactHref = `mailto:${company.email}?subject=Certalytic%20Enterprise%20inquiry`;

    return (
        <MarketingPageShell>
            <Head title="Prevent costly proxy hires- EU-sovereign integrity screening" />

            <main>
                <section className="mx-auto flex min-h-[88vh] max-w-6xl items-center px-6 py-20 md:py-28">
                    <div className="grid w-full items-center gap-12 lg:grid-cols-2 lg:gap-16">
                        <div>
                            <p className="text-[11px] font-bold tracking-[0.2em] text-primary uppercase">
                                The  checkpoint before the offer letter
                            </p>
                            <h1 className="mt-4 font-serif text-4xl leading-[1.05] tracking-tight md:text-6xl lg:text-[4rem]">
                                Prevent the{' '}
                                <span className="text-primary">€100,000 mistake</span>{' '}
                                of hiring a proxy candidate.
                            </h1>
                            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
                                Certalytic is the final integrity dossier for senior
                                technical hires- cross-checking CVs, merged interview
                                transcripts, and public profiles on EU-sovereign
                                infrastructure. Two minutes of review. Zero automated
                                hire or reject decisions.
                            </p>
                            <div className="mt-10 flex flex-wrap gap-3">
                                <Button size="lg" asChild>
                                    <Link
                                        href={
                                            auth.user ? dashboardUrl : register()
                                        }
                                    >
                                        {auth.user
                                            ? 'Open dashboard'
                                            : 'Build your first dossier'}
                                        <ArrowRight size={16} />
                                    </Link>
                                </Button>
                                <Button size="lg" variant="outline" asChild>
                                    <a href={contactHref}>Talk to sales</a>
                                </Button>
                            </div>
                        </div>

                        <div className="flex items-center justify-center lg:justify-end">
                            <img
                                src="/hero.svg"
                                alt="Recruiter reviewing a candidate integrity dossier before making a hire decision"
                                className="w-full max-w-lg"
                                width={799}
                                height={552}
                            />
                        </div>
                    </div>
                </section>

                <MarketingEuPrivacySection />

                <MarketingStatsSection />

                <MarketingProcessSection />

                <section
                    id="product"
                    className="border-b border-border bg-card/40 py-20 md:py-24"
                >
                    <div className="mx-auto max-w-6xl px-6">
                        <div className="mb-10 max-w-2xl">
                            <h2 className="font-serif text-3xl tracking-tight md:text-4xl">
                                Build the integrity dossier before you send the offer.
                            </h2>
                            <p className="mt-3 text-muted-foreground">
                                Upload the CV and merged interview transcripts- the
                                deliberate final step after your technical loop. Certalytic
                                returns four weighted integrity signals, cited flags, and
                                follow-up prompts your hiring manager can act on.
                            </p>
                        </div>
                        <MarketingFeaturesBento />
                    </div>
                </section>

                <section id="demo" className="py-20 md:py-24">
                    <div className="mx-auto max-w-6xl px-6">
                        <div className="mb-10 max-w-2xl">
                            <h2 className="font-serif text-3xl tracking-tight md:text-4xl">
                                Sample integrity dossier
                            </h2>
                            <p className="mt-3 text-muted-foreground">
                                Exactly what your Head of Talent or CTO receives before
                                signing off- integrity score, signal profile, flags,
                                and recommended follow-ups. Exportable as a watermarked PDF.
                            </p>
                        </div>
                        <MarketingScreeningPreview />
                    </div>
                </section>

                <MarketingPricingSection />

                <section className="border-y border-border py-20">
                    <div className="mx-auto max-w-6xl px-6">
                        <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
                            <div>
                                <h2 className="font-serif text-3xl tracking-tight md:text-4xl">
                                    Built for high-stakes technical hiring- not volume recruiting.
                                </h2>
                                <ul className="mt-8 space-y-4 text-sm leading-relaxed text-muted-foreground">
                                    <li>
                                        <strong className="text-foreground">
                                            CTOs & engineering leaders
                                        </strong>{' '}
                                        hiring senior ICs and staff engineers where one
                                        bad hire costs months of runway and compounding
                                        technical debt.
                                    </li>
                                    <li>
                                        <strong className="text-foreground">
                                            Technical recruiting agencies
                                        </strong>{' '}
                                        placing €100k+ roles who need a defensible integrity
                                        checkpoint before presenting candidates to clients.
                                    </li>
                                    <li>
                                        <strong className="text-foreground">
                                            Heads of Talent
                                        </strong>{' '}
                                        who mandate a two-minute final screening policy
                                        across interviewers- quality control, not data entry.
                                    </li>
                                </ul>
                            </div>
                            <div className="border border-border bg-card p-8">
                                <h3 className="text-lg font-semibold">
                                    An insurance policy at the finish line
                                </h3>
                                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                                    Certalytic sits at the end of your interview loop- after
                                    the technical rounds, before the offer letter. Recruiters
                                    deliberately assemble the candidate&apos;s integrity dossier
                                    from CV and transcript sources. That manual step is the
                                    checkpoint, not the bottleneck.
                                </p>
                                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                                    We package recruiter expertise into a repeatable,
                                    EU-sovereign workflow. Probabilistic signals cite evidence;
                                    your team stays in control of every advance or rejection.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                <MarketingReviewsSection />

                <MarketingRoadmapSection />

                <section className="bg-primary py-16 text-primary-foreground/80">
                    <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-6 md:flex-row md:items-center">
                        <div>
                            <p className="max-w-lg text-2xl font-semibold text-primary-foreground">
                                Start with three free integrity dossiers.
                            </p>
                            <p className="mt-2 max-w-lg text-sm text-primary-foreground/80">
                                No credit card. Upload a CV and merged transcript, export
                                your first dossier in minutes.
                            </p>
                        </div>
                        <Button
                            size="lg"
                            variant="secondary"
                            className="text-foreground"
                            asChild
                        >
                            <Link
                                href={auth.user ? dashboardUrl : register()}
                            >
                                {auth.user
                                    ? 'Go to dashboard'
                                    : 'Create free account'}
                                <ArrowRight size={16} />
                            </Link>
                        </Button>
                    </div>
                </section>
            </main>
        </MarketingPageShell>
    );
}
