"use client";

import Link from "@/components/ui/link";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Profile", href: routes.settingsProfile() },
  { label: "Security", href: routes.settingsSecurity() },
  { label: "Appearance", href: routes.settingsAppearance() },
  { label: "Organization", href: routes.settingsOrganization() },
] as const;

export function SettingsNav() {
  const pathname = usePathname();

  return (
    <nav
      className="flex flex-col space-y-1"
      aria-label="Settings"
    >
      {NAV_ITEMS.map(({ label, href }) => {
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
