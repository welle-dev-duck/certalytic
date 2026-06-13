"use client";

import { Languages } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LOCALE_NATIVE_LABELS,
  locales,
  type Locale,
} from "@/lib/i18n/config";
import { useI18n, useTranslations } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";

type LanguageSwitcherProps = {
  className?: string;
  compact?: boolean;
};

export function LanguageSwitcher({
  className,
  compact = false,
}: LanguageSwitcherProps) {
  const { locale, setLocale } = useI18n();
  const t = useTranslations("common");

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {!compact ? (
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Languages size={14} aria-hidden />
          {t("language")}
        </span>
      ) : null}
      <Select
        value={locale}
        onValueChange={(value) => setLocale(value as Locale)}
      >
        <SelectTrigger
          size="sm"
          className={cn(compact ? "w-[7.5rem]" : "w-[9rem]")}
          aria-label={t("language")}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="end">
          {locales.map((option) => (
            <SelectItem key={option} value={option}>
              {LOCALE_NATIVE_LABELS[option]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
