"use client";

import { Menu, Scale } from "lucide-react";
import Link from "@/components/ui/link";
import { useState } from "react";

import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { COMPANY } from "@/lib/company";
import { captureMarketingCta } from "@/lib/analytics";
import { useTranslations } from "@/lib/i18n/client";
import { routes } from "@/lib/routes";
import { useAuth } from "@/providers/auth-provider";

const NAV_ITEMS = [
  { href: "/#features", labelKey: "header.features" },
  { href: "/#process", labelKey: "header.process" },
  { href: "/#demo", labelKey: "header.demo" },
  { href: "/#pricing", labelKey: "header.pricing" },
] as const;

function AuthActions({ className }: { className?: string }) {
  const { isAuthenticated } = useAuth();
  const t = useTranslations("marketing");

  if (isAuthenticated) {
    return (
      <div className={className}>
        <Button size="sm" className="w-full" asChild>
          <Link
            href={routes.dashboard()}
            onClick={() =>
              captureMarketingCta("header.dashboard", t("header.dashboard"))
            }
          >
            {t("header.dashboard")}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className={className}>
      <Button variant="ghost" size="sm" className="w-full" asChild>
        <Link
          href={routes.signIn()}
          onClick={() =>
            captureMarketingCta("header.sign_in", t("header.logIn"))
          }
        >
          {t("header.logIn")}
        </Link>
      </Button>
      <Button size="sm" className="w-full" asChild>
        <Link
          href={routes.signUp()}
          onClick={() =>
            captureMarketingCta("header.sign_up", t("header.startFree"))
          }
        >
          {t("header.startFree")}
        </Link>
      </Button>
    </div>
  );
}

export function MarketingHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const t = useTranslations("marketing");

  return (
    <header className="sticky top-0 z-30 border-b border-border/80 bg-background/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center border border-primary bg-primary/10">
            <Scale size={16} className="text-primary" />
          </div>
          <span className="text-sm font-bold tracking-wide">{COMPANY.name}</span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm text-muted-foreground lg:flex">
          {NAV_ITEMS.map(({ href, labelKey }) => (
            <a key={href} href={href} className="hover:text-foreground">
              {t(labelKey)}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <LanguageSwitcher compact />
          <AuthActions className="flex items-center gap-2" />
        </div>

        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              aria-label={t("header.openMenu")}
            >
              <Menu size={20} />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full max-w-xs">
            <SheetHeader className="border-b border-border pb-4 text-left">
              <SheetTitle>{COMPANY.name}</SheetTitle>
            </SheetHeader>

            <nav className="flex flex-col gap-1 px-4">
              {NAV_ITEMS.map(({ href, labelKey }) => (
                <a
                  key={href}
                  href={href}
                  className="rounded-md px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
                  onClick={() => setMenuOpen(false)}
                >
                  {t(labelKey)}
                </a>
              ))}
            </nav>

            <div className="mt-4 border-t border-border px-4 pt-4">
              <LanguageSwitcher />
            </div>

            <AuthActions className="mt-auto flex flex-col gap-2 px-4 pb-4" />
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
