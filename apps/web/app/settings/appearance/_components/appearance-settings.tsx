"use client";

import { AppearanceToggle } from "@/components/settings/appearance-toggle";
import { useTranslations } from "@/lib/i18n/client";

export function AppearanceSettings() {
  const t = useTranslations("settings");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">
          {t("appearancePage.title")}
        </h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {t("appearancePage.description")}
        </p>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium text-foreground">
          {t("appearancePage.themeLabel")}
        </p>
        <AppearanceToggle />
      </div>
    </div>
  );
}
