import {
  Fira_Code,
  Hanken_Grotesk,
  Newsreader,
} from "next/font/google";
import type { Metadata } from "next";

import "./globals.css";
import { AppLogoIcon } from "@/components/brand/app-logo-icon";
import Link from "@/components/ui/link";
import { COMPANY } from "@/lib/company";
import { getLocale, getTranslations } from "@/lib/i18n/server";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/providers/theme-provider";
import { NotFoundButton } from "./_components/not-found-button";

const hankenGrotesk = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-hanken",
  display: "swap",
});

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
  display: "swap",
});

const firaCode = Fira_Code({
  subsets: ["latin"],
  variable: "--font-fira",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("common");

  return {
    title: t("notFound.metadataTitle"),
    description: t("notFound.metadataDescription"),
  };
}

export default async function GlobalNotFound() {
  const locale = await getLocale();
  const t = await getTranslations("common");

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={cn(
        hankenGrotesk.variable,
        newsreader.variable,
        firaCode.variable,
        "h-full",
      )}
    >
      <body className="h-full font-sans antialiased">
        <ThemeProvider>
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
                    {t("notFound.tagline")}
                  </p>
                </div>
              </Link>
            </header>

            <main className="flex flex-1 items-center justify-center px-6 py-12">
              <div className="surface-panel w-full max-w-lg rounded-lg p-8 md:p-10">
                <div className="text-center">
                  <p className="text-[11px] font-bold tracking-[0.2em] text-primary uppercase">
                    {t("notFound.eyebrow")}
                  </p>
                  <h1 className="mt-4 font-serif text-4xl leading-[1.05] tracking-tight md:text-5xl">
                    {t("notFound.title")}
                  </h1>
                  <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted-foreground md:text-base">
                    {t("notFound.description")}
                  </p>
                </div>

                <div className="mt-8 flex justify-center">
                  <NotFoundButton />
                </div>

                <div className="mt-8 flex items-center justify-center gap-2 border-t border-border pt-6 opacity-70">
                  <AppLogoIcon className="size-4 text-primary" />
                  <span className="text-xs text-muted-foreground">
                    {COMPANY.name}
                  </span>
                </div>
              </div>
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
