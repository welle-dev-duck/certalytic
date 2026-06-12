"use client";

import Link from "@/components/ui/link"
import { usePathname } from "next/navigation";

import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Profile", href: routes.settingsProfile() },
  { label: "Security", href: routes.settingsSecurity() },
  { label: "Appearance", href: routes.settingsAppearance() },
  { label: "Organization", href: routes.settingsOrganization() },
  { label: "Teams", href: routes.settingsTeams() },
] as const;

export function SettingsNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-1 border-b border-border pb-4">
      {NAV_ITEMS.map(({ label, href }) => {
        const active =
          pathname === href || pathname.startsWith(`${href}/`);

        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
