"use client";

import type { ReactNode } from "react";

import { AppLogo } from "@/components/brand/app-logo";
import { AppLogoIcon } from "@/components/brand/app-logo-icon";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import Link from "@/components/ui/link";
import { COMPANY } from "@/lib/company";
import { useTranslations } from "@/lib/i18n/client";
import { routes } from "@/lib/routes";

type AuthShellProps = {
  children: ReactNode;
};

export function AuthShell({ children }: AuthShellProps) {
  const t = useTranslations("auth");

  return (
    <div className="grid min-h-dvh flex-1 overflow-y-auto lg:grid-cols-2">
      <div className="brand-gradient relative hidden flex-col justify-between overflow-hidden p-10 text-white lg:flex">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,oklch(0.42_0.06_172_/_0.35),transparent_55%)]"
        />
        <Link
          href={routes.home()}
          className="relative z-10 inline-flex items-center gap-3"
        >
          <div className="flex size-10 items-center justify-center rounded-sm bg-white/10 ring-1 ring-white/25">
            <AppLogoIcon className="size-5 text-white" />
          </div>
          <div>
            <p className="font-display text-lg font-semibold tracking-tight">
              {COMPANY.name}
            </p>
            <p className="text-[10px] font-medium tracking-wide text-white/60 uppercase">
              {t("shell.tagline")}
            </p>
          </div>
        </Link>
        <div className="relative z-10 max-w-md space-y-4">
          <p className="font-display text-3xl font-semibold tracking-tight text-balance text-white">
            {t("shell.headline")}
          </p>
          <p className="text-sm leading-relaxed text-white/80">
            {t("shell.description")}
          </p>
        </div>
        <p className="relative z-10 text-xs tracking-wide text-white/55 uppercase">
          {t("shell.footer", { company: COMPANY.name })}
        </p>
      </div>

      <div className="flex flex-col items-center justify-center border-border bg-background p-6 md:p-10 lg:border-l">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex flex-col gap-6 lg:hidden">
            <div className="flex items-start justify-between gap-4">
              <Link
                href={routes.home()}
                className="inline-flex max-w-fit items-center gap-2"
              >
                <AppLogo />
              </Link>
              <LanguageSwitcher compact />
            </div>
          </div>

          <div className="mb-4 hidden justify-end lg:flex">
            <LanguageSwitcher compact />
          </div>

          <div className="surface-panel p-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
