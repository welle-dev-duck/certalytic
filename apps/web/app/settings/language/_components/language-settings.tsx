"use client";

import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { SettingsSection } from "@/components/settings/settings-section";
import { useTranslations } from "@/lib/i18n/client";

export function LanguageSettings() {
  const t = useTranslations("settings");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">
          {t("languagePage.title")}
        </h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {t("languagePage.description")}
        </p>
      </div>

      <SettingsSection label={t("languagePage.label")}>
        <div className="space-y-4 rounded-lg border border-border bg-card p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-medium text-foreground">
              {t("languagePage.current")}
            </p>
            <LanguageSwitcher />
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {t("languagePage.note")}
          </p>
        </div>
      </SettingsSection>
    </div>
  );
}
