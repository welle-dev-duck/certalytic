import { MARKETING_STATS } from "@/lib/marketing-data";

export function MarketingStatsSection() {
  const items = [
    {
      value: MARKETING_STATS.candidates_screened,
      label: "Candidates screened",
      detail: "Integrity reports generated across technical hiring loops",
    },
    {
      value: MARKETING_STATS.customers,
      label: "Teams hiring with Certalytic",
      detail: `Recruiters improving selection quality in ${MARKETING_STATS.countries} countries`,
    },
    {
      value: MARKETING_STATS.audio_hours,
      label: "Hours of interview audio processed",
      detail: "Speaker-labelled transcripts ready for integrity analysis",
    },
    {
      value: MARKETING_STATS.saved_millions,
      label: "Estimated cost of bad senior hires avoided",
      detail:
        "One proxy hire can cost €100k+ in runway, comp, and technical debt",
    },
  ];

  return (
    <section className="border-y border-border py-16 md:py-20">
      <div className="mx-auto max-w-6xl px-6">
        <p className="text-center text-[11px] font-bold tracking-[0.2em] text-primary uppercase">
          By the numbers
        </p>
        <h2 className="mt-3 text-center font-serif text-3xl tracking-tight text-primary md:text-4xl">
          The cost of one bad senior hire dwarfs the price of screening
        </h2>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => (
            <div
              key={item.label}
              className="border border-border bg-primary/5 p-6 text-center"
            >
              <p className="font-serif text-4xl tracking-tight text-primary tabular-nums md:text-5xl">
                {item.value}
              </p>
              <p className="mt-3 text-sm font-semibold text-primary">
                {item.label}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                {item.detail}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
