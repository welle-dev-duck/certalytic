"use client";

import Link from "@/components/ui/link";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { OrganizationLanguageSelect } from "@/features/organizations/components/organization-language-select";
import type { ScreeningStepProps } from "@/features/candidates/components/start-screening/types";
import { RoleCombobox } from "@/features/roles/components/role-combobox";
import type { RoleOption } from "@/features/roles/types";
import type { OrganizationLanguage } from "@/lib/i18n/organization-language";
import { useTranslations } from "@/lib/i18n/client";
import { routes } from "@/lib/routes";

type GeneralStepProps = ScreeningStepProps & {
  roles: RoleOption[];
  lockRole?: boolean;
};

export function GeneralStep({
  form,
  errors,
  updateForm,
  roles,
  lockRole = false,
}: GeneralStepProps) {
  const t = useTranslations("app");

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {t("screening.generalStep.description")}
      </p>

      {roles.length === 0 ? (
        <div className="rounded-lg border border-dashed p-6 text-center">
          <p className="text-sm text-muted-foreground">
            {t("screening.generalStep.empty")}
          </p>
          <Button asChild className="mt-3" size="sm">
            <Link href={routes.roles()}>{t("screening.generalStep.goToRoles")}</Link>
          </Button>
        </div>
      ) : (
        <Field data-invalid={Boolean(errors.roleId)}>
          <FieldLabel htmlFor="screening-role">
            {t("screening.generalStep.roleLabel")}
          </FieldLabel>
          <RoleCombobox
            id="screening-role"
            value={form.roleId}
            onValueChange={(value) => updateForm("roleId", value)}
            roles={roles}
            disabled={lockRole}
            placeholder={t("screening.generalStep.rolePlaceholder")}
            searchPlaceholder={t("screening.generalStep.roleSearchPlaceholder")}
            emptyMessage={t("screening.generalStep.roleEmpty")}
          />
          {errors.roleId ? <FieldError>{errors.roleId}</FieldError> : null}
        </Field>
      )}

      <Field data-invalid={Boolean(errors.language)}>
        <FieldLabel htmlFor="screening-language">
          {t("screening.generalStep.languageLabel")}
        </FieldLabel>
        <OrganizationLanguageSelect
          id="screening-language"
          value={form.language}
          onValueChange={(value) =>
            updateForm("language", value as OrganizationLanguage)
          }
          placeholder={t("screening.generalStep.languagePlaceholder")}
        />
        <FieldDescription>
          {t("screening.generalStep.languageDescription")}
        </FieldDescription>
        {errors.language ? <FieldError>{errors.language}</FieldError> : null}
      </Field>
    </div>
  );
}
