"use client";

import Link from "@/components/ui/link";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { useTranslations } from "@/lib/i18n/client";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

export function SettingsNav() {
  const pathname = usePathname();
  const t = useTranslations("settings");

  const navItems = [
    { label: t("nav.profile"), href: routes.settingsProfile() },
    { label: t("nav.security"), href: routes.settingsSecurity() },
    { label: t("nav.appearance"), href: routes.settingsAppearance() },
    { label: t("nav.language"), href: routes.settingsLanguage() },
    { label: t("nav.organization"), href: routes.settingsOrganization() },
  ] as const;

  return (
    <nav className="flex flex-col space-y-1" aria-label={t("layout.title")}>
      {navItems.map(({ label, href }) => {
        const active =
          pathname === href || pathname.startsWith(`${href}/`);

        return (
          <Button
            key={href}
            size="sm"
            variant="ghost"
            asChild
            className={cn("w-full justify-start", active && "bg-muted")}
          >
            <Link href={href}>{label}</Link>
          </Button>
        );
      })}
    </nav>
  );
}
