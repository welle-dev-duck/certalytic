"use client";

import { Building2, ShieldCheck } from "lucide-react";

import { AppLogoIcon } from "@/components/brand/app-logo-icon";
import { CreateTeamModal } from "@/components/layout/create-team-modal";
import { Button } from "@/components/ui/button";
import { COMPANY } from "@/lib/company";
import { useTranslations } from "@/lib/i18n/client";

export function NoOrganizationPanel() {
  const t = useTranslations("app");

  return (
    <div className="flex min-h-[calc(100dvh-var(--banner-height,0px)-var(--impersonation-banner-height,0px))] flex-col bg-background">
      <header className="flex items-center gap-2.5 border-b border-border px-6 py-4">
        <div className="flex h-7 w-7 items-center justify-center rounded border border-primary/30 bg-primary/15">
          <ShieldCheck size={14} className="text-primary" />
        </div>
        <p className="text-sm font-bold tracking-tight text-foreground">
          {t("sidebar.brand")}
        </p>
      </header>

      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="surface-panel w-full max-w-md space-y-6 rounded-lg p-8">
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg border border-border bg-muted/40">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <h1 className="font-display text-2xl font-semibold tracking-tight">
              {t("org.noOrganization.title")}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {t("org.noOrganization.description")}
            </p>
          </div>

          <CreateTeamModal>
            <Button size="lg" className="h-12 w-full">
              <Building2 className="mr-2 h-4 w-4" />
              {t("org.noOrganization.createTeam")}
            </Button>
          </CreateTeamModal>

          <div className="flex items-center justify-center gap-2 border-t border-border pt-4 opacity-60">
            <AppLogoIcon className="size-4" />
            <span className="text-xs text-muted-foreground">{COMPANY.name}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
