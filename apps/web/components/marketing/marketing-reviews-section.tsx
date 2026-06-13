"use client";

import { Star } from "lucide-react";

import { useTranslations } from "@/lib/i18n/client";

const reviewIds = ["1", "2", "3"] as const;

const reviewAccents = [
  "bg-primary/15 text-primary",
  "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  "bg-amber-500/15 text-amber-600 dark:text-amber-400",
] as const;

function StarRating({
  rating,
  ariaLabel,
}: {
  rating: number;
  ariaLabel: string;
}) {
  return (
    <div className="flex gap-0.5" aria-label={ariaLabel}>
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          size={14}
          className={
            index < rating
              ? "fill-amber-400 text-amber-400"
              : "fill-muted text-muted"
          }
        />
      ))}
    </div>
  );
}

export function MarketingReviewsSection() {
  const t = useTranslations("marketing");

  return (
    <section id="reviews" className="py-20 md:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="font-serif text-3xl tracking-tight md:text-4xl">
          {t("reviews.title")}
        </h2>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          {t("reviews.description")}
        </p>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {reviewIds.map((id, index) => {
            const name = t(`reviews.items.${id}.name`);
            const initials = name
              .split(" ")
              .map((part) => part[0])
              .join("")
              .slice(0, 2)
              .toUpperCase();

            return (
              <figure
                key={id}
                className="flex h-full flex-col border border-border bg-background p-6"
              >
                <StarRating
                  rating={5}
                  ariaLabel={t("reviews.starRatingAria", { rating: 5 })}
                />
                <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-foreground">
                  &ldquo;{t(`reviews.items.${id}.quote`)}&rdquo;
                </blockquote>
                <figcaption className="mt-6 flex items-center gap-3 border-t border-border pt-4">
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-bold ${reviewAccents[index]}`}
                    aria-hidden
                  >
                    {initials}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">{name}</span>
                    <br />
                    {t(`reviews.items.${id}.role`)} ·{" "}
                    {t(`reviews.items.${id}.org`)}
                  </div>
                </figcaption>
              </figure>
            );
          })}
        </div>
      </div>
    </section>
  );
}
