"use client";

import { Home, RotateCcw } from "lucide-react";

import { AppLogoIcon } from "@/components/brand/app-logo-icon";
import { Button } from "@/components/ui/button";
import Link from "@/components/ui/link";
import { COMPANY } from "@/lib/company";
import { routes } from "@/lib/routes";

type ErrorPageContentProps = {
  eyebrow: string;
  title: string;
  description: string;
  retryLabel: string;
  homeLabel: string;
  onRetry?: () => void;
};

export function ErrorPageContent({
  eyebrow,
  title,
  description,
  retryLabel,
  homeLabel,
  onRetry,
}: ErrorPageContentProps) {
  return (
    <div className="relative flex min-h-dvh flex-col bg-background text-foreground">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-size-[4rem_4rem] mask-[radial-gradient(ellipse_at_top,black,transparent_70%)] opacity-40"
      />

      <header className="mx-auto flex w-full max-w-6xl items-center px-6 py-6">
        <Link
          href={routes.home()}
          className="inline-flex items-center gap-3 transition-opacity hover:opacity-80"
        >
          <div className="flex size-10 items-center justify-center rounded-sm bg-sidebar-primary shadow-sm">
            <AppLogoIcon className="size-5 text-sidebar-primary-foreground" />
          </div>
          <div>
            <p className="font-display text-sm font-semibold tracking-tight">
              {COMPANY.name}
            </p>
            <p className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
              Integrity screening
            </p>
          </div>
        </Link>
      </header>

      <main className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="surface-panel w-full max-w-lg rounded-lg p-8 md:p-10">
          <div className="text-center">
            <p className="text-[11px] font-bold tracking-[0.2em] text-primary uppercase">
              {eyebrow}
            </p>
            <h1 className="mt-4 font-serif text-4xl leading-[1.05] tracking-tight md:text-5xl">
              {title}
            </h1>
            <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted-foreground md:text-base">
              {description}
            </p>
          </div>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            {onRetry ? (
              <Button size="lg" className="w-full sm:w-auto" onClick={onRetry}>
                <RotateCcw size={16} />
                {retryLabel}
              </Button>
            ) : null}
            <Button
              size="lg"
              variant={onRetry ? "outline" : "default"}
              className="w-full sm:w-auto"
              asChild
            >
              <Link href={routes.home()}>
                <Home size={16} />
                {homeLabel}
              </Link>
            </Button>
          </div>

          <div className="mt-8 flex items-center justify-center gap-2 border-t border-border pt-6 opacity-70">
            <AppLogoIcon className="size-4 text-primary" />
            <span className="text-xs text-muted-foreground">{COMPANY.name}</span>
          </div>
        </div>
      </main>
    </div>
  );
}
