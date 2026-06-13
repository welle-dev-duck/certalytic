import type { ReactNode } from "react";

import { AppLayout } from "@/components/layout/app-layout";
import { SettingsNav } from "@/components/settings/settings-nav";
import { Separator } from "@/components/ui/separator";
import { getTranslations } from "@/lib/i18n/server";

export default async function SettingsLayout({
  children,
}: {
  children: ReactNode;
}) {
  const t = await getTranslations("settings");

  return (
    <AppLayout>
      <div className="px-4 py-6">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-foreground">
            {t("layout.title")}
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {t("layout.description")}
          </p>
        </div>

        <div className="flex flex-col gap-6 lg:flex-row lg:gap-12">
          <aside className="w-full max-w-xl lg:w-48">
            <SettingsNav />
          </aside>

          <Separator className="lg:hidden" />

          <div className="min-w-0 flex-1 md:max-w-2xl">
            <section className="max-w-xl space-y-12">{children}</section>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
