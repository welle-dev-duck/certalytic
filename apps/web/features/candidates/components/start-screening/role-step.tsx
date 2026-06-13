"use client";

import { CheckCircle2 } from "lucide-react";
import Link from "@/components/ui/link";

import { Button } from "@/components/ui/button";
import type { ScreeningStepProps } from "@/features/candidates/components/start-screening/types";
import type { RoleListItem } from "@/features/roles/types";
import { useTranslations } from "@/lib/i18n/client";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

type RoleStepProps = ScreeningStepProps & {
  roles: RoleListItem[];
};

export function RoleStep({ form, errors, updateForm, roles }: RoleStepProps) {
  const t = useTranslations("app");

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {t("screening.roleStep.description")}
      </p>

      {roles.length === 0 ? (
        <div className="rounded-lg border border-dashed p-6 text-center">
          <p className="text-sm text-muted-foreground">
            {t("screening.roleStep.empty")}
          </p>
          <Button asChild className="mt-3" size="sm">
            <Link href={routes.roles()}>{t("screening.roleStep.goToRoles")}</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {roles.map((role) => {
            const selected = form.roleId === role.id;
            const candidatesKey =
              role.candidatesCount === 1
                ? "screening.roleStep.candidatesSingular"
                : "screening.roleStep.candidatesPlural";

            return (
              <button
                key={role.id}
                type="button"
                onClick={() => updateForm("roleId", role.id)}
                className={cn(
                  "flex cursor-pointer flex-col gap-1 rounded-lg border p-3 text-left transition-colors",
                  selected
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted/50",
                )}
              >
                <span className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground">
                    {role.title}
                  </span>
                  {selected ? (
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                  ) : null}
                </span>
                <span className="text-xs text-muted-foreground">
                  {t(candidatesKey, { count: role.candidatesCount })}
                </span>
              </button>
            );
          })}
        </div>
      )}
      {errors.roleId ? (
        <p className="text-sm text-destructive">{errors.roleId}</p>
      ) : null}
    </div>
  );
}
