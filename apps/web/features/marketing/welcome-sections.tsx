import { ArrowRight, Check, ShieldCheck } from "lucide-react";
import Image from "next/image";
import Link from "@/components/ui/link";

import { DataPrivacyPanel } from "@/components/marketing/data-privacy-panel";
import { MarketingFeaturesBento } from "@/components/marketing/marketing-features-bento";
import { MarketingScreeningPreview } from "@/components/marketing/marketing-screening-preview";
import { Button } from "@/components/ui/button";
import {
  FREE_PLAN_TOKENS,
  getMarketingPricingPlans,
} from "@/lib/marketing-data";
import { COMPANY } from "@/lib/company";
import { routes } from "@/lib/routes";

const trustPoints = [
  "Certalytic is EU-based and GDPR-compliant",
  "EU-only storage & inference path",
  "Decision support — not automated hiring",
  "Candidate data is kept and processed within EU based infrastructure",
  "Transcription audio is deleted after transcription completes",
];

export function WelcomeHero() {
  const contactHref = `mailto:${COMPANY.email}?subject=Certalytic%20Enterprise%20inquiry`;

  return (
    <section className="mx-auto flex min-h-[88vh] max-w-6xl items-center px-6 py-20 md:py-28">
      <div className="grid w-full items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div>
          <p className="text-[11px] font-bold tracking-[0.2em] text-primary uppercase">
            The checkpoint before the offer letter
          </p>
          <h1 className="mt-4 font-serif text-4xl leading-[1.05] tracking-tight md:text-6xl lg:text-[4rem]">
            Prevent the{" "}
            <span className="text-primary">€100,000 mistake</span> of hiring a
            proxy candidate.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
            Certalytic is the final integrity dossier for senior technical
            hires—cross-checking CVs, merged interview transcripts, and public
            profiles on EU-sovereign infrastructure. Two minutes of review. Zero
            automated hire or reject decisions.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Button size="lg" asChild>
              <Link href={routes.signUp()}>
                Screen a candidate
                <ArrowRight size={16} />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href={contactHref}>Talk to sales</a>
            </Button>
          </div>
        </div>
        <div className="flex items-center justify-center lg:justify-end">
          <Image
            src="/hero.svg"
            alt="Recruiter reviewing a candidate integrity dossier before making a hire decision"
            width={799}
            height={552}
            className="w-full max-w-lg"
            priority
          />
        </div>
      </div>
    </section>
  );
}

export function EuPrivacySection() {
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
              Your candidates&apos; data never leaves{" "}
              <span className="text-primary">EU jurisdiction.</span>
            </h2>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
              In Europe, candidate audio and CVs cannot route through US cloud
              LLMs. Certalytic processes exclusively on EU soil — the compliance
              moat that disqualifies American competitors from your senior hiring
              pipeline.
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
                <Link href={routes.legal.privacy()}>
                  Privacy Policy
                  <ArrowRight size={14} />
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href={routes.legal.dpa()}>DPA</Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href={routes.legal.imprint()}>Imprint</Link>
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
                { label: "Hetzner", sub: "DE / FI" },
                { label: "Mistral", sub: "Paris" },
                { label: "Stripe", sub: "Billing only" },
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

export function ProductSection() {
  return (
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
            Upload the CV and merged interview transcripts — the deliberate final
            step after your technical loop. Certalytic returns four weighted
            integrity signals, cited flags, and follow-up prompts your hiring
            manager can act on.
          </p>
        </div>
        <MarketingFeaturesBento />
      </div>
    </section>
  );
}

export function DemoSection() {
  return (
    <section id="demo" className="py-20 md:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-10 max-w-2xl">
          <h2 className="font-serif text-3xl tracking-tight md:text-4xl">
            Sample integrity dossier
          </h2>
          <p className="mt-3 text-muted-foreground">
            Exactly what your Head of Talent or CTO receives before signing off —
            integrity score, signal profile, flags, and recommended follow-ups.
            Exportable as a watermarked PDF.
          </p>
        </div>
        <MarketingScreeningPreview />
      </div>
    </section>
  );
}

export function PricingSection() {
  const plans = getMarketingPricingPlans();

  return (
    <section id="pricing" className="border-y border-border py-20 md:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-10 max-w-2xl">
          <h2 className="font-serif text-3xl tracking-tight md:text-4xl">
            Pricing that pays for itself on the first prevented mistake
          </h2>
          <p className="mt-3 text-muted-foreground">
            Scale to agency volume or mandate team-wide checkpoints — a fraction
            of one mis-hire.
          </p>
        </div>

        <div className="mb-8 rounded-lg border border-primary/20 bg-primary/5 px-5 py-4">
          <p className="text-sm leading-relaxed text-foreground">
            <strong>Try before you subscribe.</strong> Every new account starts
            on our Free plan — {FREE_PLAN_TOKENS} integrity dossiers per month,
            no credit card required.{" "}
            <Link
              href={routes.signUp()}
              className="font-medium text-primary underline-offset-2 hover:underline"
            >
              Create a free account
            </Link>
            .
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan) => {
            const isEnterprise = plan.value === "enterprise";

            return (
              <div
                key={plan.value}
                className={`flex flex-col border p-6 ${
                  plan.highlighted
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border bg-card"
                }`}
              >
                <p className="text-sm font-bold text-foreground">{plan.label}</p>
                <p className="mt-2 font-serif text-3xl tabular-nums text-foreground">
                  {plan.price === null ? (
                    "Custom"
                  ) : (
                    <>
                      €{plan.price}
                      <span className="text-sm font-sans font-normal text-muted-foreground">
                        /mo
                      </span>
                    </>
                  )}
                </p>

                {plan.tokens !== null && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    {plan.tokens} screenings / month · {plan.seats} seat
                    {plan.seats !== 1 ? "s" : ""}
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
                  variant={plan.highlighted ? "default" : "outline"}
                  asChild
                >
                  {isEnterprise ? (
                    <a
                      href={`mailto:${COMPANY.email}?subject=Certalytic%20Enterprise`}
                    >
                      Contact sales
                    </a>
                  ) : (
                    <Link href={routes.signUp()}>Get started</Link>
                  )}
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function AudienceSection() {
  return (
    <section className="border-y border-border py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
          <div>
            <h2 className="font-serif text-3xl tracking-tight md:text-4xl">
              Built for high-stakes technical hiring — not volume recruiting.
            </h2>
            <ul className="mt-8 space-y-4 text-sm leading-relaxed text-muted-foreground">
              <li>
                <strong className="text-foreground">
                  CTOs & engineering leaders
                </strong>{" "}
                hiring senior ICs and staff engineers where one bad hire costs
                months of runway and compounding technical debt.
              </li>
              <li>
                <strong className="text-foreground">
                  Technical recruiting agencies
                </strong>{" "}
                placing €100k+ roles who need a defensible integrity checkpoint
                before presenting candidates to clients.
              </li>
              <li>
                <strong className="text-foreground">Heads of Talent</strong> who
                mandate a two-minute final screening policy across
                interviewers — quality control, not data entry.
              </li>
            </ul>
          </div>
          <div className="border border-border bg-card p-8">
            <h3 className="text-lg font-semibold">
              An insurance policy at the finish line
            </h3>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Certalytic sits at the end of your interview loop — after the
              technical rounds, before the offer letter. Recruiters deliberately
              assemble the candidate&apos;s integrity dossier from CV and
              transcript sources. That manual step is the checkpoint, not the
              bottleneck.
            </p>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              We package recruiter expertise into a repeatable, EU-sovereign
              workflow. Probabilistic signals cite evidence; your team stays in
              control of every advance or rejection.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function CtaSection() {
  return (
    <section className="bg-primary py-16 text-primary-foreground/80">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-6 md:flex-row md:items-center">
        <div>
          <p className="max-w-lg text-2xl font-semibold text-primary-foreground">
            Start with three free integrity dossiers.
          </p>
          <p className="mt-2 max-w-lg text-sm text-primary-foreground/80">
            No credit card. Upload a CV and merged transcript, export your first
            dossier in minutes.
          </p>
        </div>
        <Button size="lg" variant="secondary" className="text-foreground" asChild>
          <Link href={routes.signUp()}>
            Create free account
            <ArrowRight size={16} />
          </Link>
        </Button>
      </div>
    </section>
  );
}
