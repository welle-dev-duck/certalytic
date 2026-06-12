import { MARKETING_ROADMAP } from "@/lib/marketing-data";

export function MarketingRoadmapSection() {
  return (
    <section
      id="roadmap"
      className="border-y border-border bg-card/40 py-20 md:py-24"
    >
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-10 max-w-2xl">
          <h2 className="font-serif text-3xl tracking-tight md:text-4xl">
            Roadmap
          </h2>
          <p className="mt-3 text-muted-foreground">
            What we&apos;re building next — approximate delivery quarters based
            on current engineering priorities.
          </p>
        </div>

        <ol className="grid gap-4 md:grid-cols-2">
          {MARKETING_ROADMAP.map((item, index) => (
            <li
              key={item.title}
              className="relative border border-border bg-background p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <span className="font-mono text-xs font-bold tracking-widest text-primary uppercase">
                  {item.quarter}
                </span>
                <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                  #{String(index + 1).padStart(2, "0")}
                </span>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-foreground">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {item.description}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
