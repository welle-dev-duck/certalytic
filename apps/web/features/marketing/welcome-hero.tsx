"use client";

import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "@/components/ui/link";

import { Button } from "@/components/ui/button";
import { COMPANY } from "@/lib/company";
import { useTranslations } from "@/lib/i18n/client";
import { routes } from "@/lib/routes";

export function WelcomeHero() {
  const t = useTranslations("marketing");
  const contactHref = `mailto:${COMPANY.email}?subject=Certalytic%20Enterprise%20inquiry`;

  return (
    <section className="mx-auto flex min-h-[88vh] max-w-6xl items-center px-6 py-20 md:py-28">
      <div className="grid w-full items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div>
          <p className="text-[11px] font-bold tracking-[0.2em] text-primary uppercase">
            {t("hero.eyebrow")}
          </p>
          <h1 className="mt-4 font-serif text-4xl leading-[1.05] tracking-tight md:text-6xl lg:text-[4rem]">
            {t("hero.titlePrefix")}{" "}
            <span className="text-primary">{t("hero.titleHighlight")}</span>{" "}
            {t("hero.titleSuffix")}
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
            {t("hero.description")}
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Button size="lg" asChild>
              <Link href={routes.signUp()}>
                {t("hero.ctaPrimary")}
                <ArrowRight size={16} />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href={contactHref}>{t("hero.ctaSecondary")}</a>
            </Button>
          </div>
        </div>
        <div className="flex items-center justify-center lg:justify-end">
          <Image
            src="/hero.svg"
            alt={t("hero.imageAlt")}
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
