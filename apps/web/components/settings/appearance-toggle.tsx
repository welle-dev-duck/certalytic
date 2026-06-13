"use client";

import type { LucideIcon } from "lucide-react";
import { Monitor, Moon, Sun } from "lucide-react";

import type { Appearance } from "@/hooks/use-appearance";
import { useAppearance } from "@/hooks/use-appearance";
import { useTranslations } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";

const TAB_VALUES: { value: Appearance; icon: LucideIcon; labelKey: "light" | "dark" | "system" }[] = [
  { value: "light", icon: Sun, labelKey: "light" },
  { value: "dark", icon: Moon, labelKey: "dark" },
  { value: "system", icon: Monitor, labelKey: "system" },
];

export function AppearanceToggle() {
  const { appearance, updateAppearance, mounted } = useAppearance();
  const t = useTranslations("settings");

  if (!mounted) {
    return (
      <div className="inline-flex h-10 w-64 animate-pulse rounded-lg bg-muted" />
    );
  }

  return (
    <div className="inline-flex gap-1 rounded-lg bg-muted p-1">
      {TAB_VALUES.map(({ value, icon: Icon, labelKey }) => (
        <button
          key={value}
          type="button"
          onClick={() => updateAppearance(value)}
          className={cn(
            "flex items-center rounded-md px-3.5 py-1.5 transition-colors",
            appearance === value
              ? "bg-background text-foreground shadow-xs"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
          )}
        >
          <Icon className="-ml-1 h-4 w-4" />
          <span className="ml-1.5 text-sm">
            {t(`appearanceToggle.${labelKey}`)}
          </span>
        </button>
      ))}
    </div>
  );
}
