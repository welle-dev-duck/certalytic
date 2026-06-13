"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { LoadingSwap } from "@/components/loading-swap";
import { Required } from "@/components/required";
import { SettingsSection } from "@/components/settings/settings-section";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { CountryCombobox } from "@/features/organizations/components/country-combobox";
import { OrganizationLanguageSelect } from "@/features/organizations/components/organization-language-select";
import {
  createOrganizationSettingsSchema,
  resolveOrganizationFormValues,
  type OrganizationValues,
} from "@/features/organizations/schemas/organization-settings.schema";
import { authClient } from "@/lib/auth-client";
import { useTranslations } from "@/lib/i18n/client";

type OrganizationProfileFormProps = {
  organizationId: string;
  name: string;
  country?: string | null;
  language?: string | null;
  onUpdated: () => void;
};

export function OrganizationProfileForm({
  organizationId,
  name,
  country,
  language,
  onUpdated,
}: OrganizationProfileFormProps) {
  const t = useTranslations("settings");
  const tCommon = useTranslations("common");

  const organizationSchema = useMemo(
    () => createOrganizationSettingsSchema(t),
    [t],
  );

  const form = useForm<OrganizationValues>({
    resolver: zodResolver(organizationSchema),
    values: resolveOrganizationFormValues({ name, country, language }),
  });

  const { isSubmitting } = form.formState;

  async function onSubmit(values: OrganizationValues) {
    const result = await authClient.organization.update({
      organizationId,
      data: {
        name: values.name,
        country: values.country,
        language: values.language,
      },
    });

    if (result.error) {
      toast.error(
        result.error.message ?? t("organizationPage.toasts.updateFailed"),
      );
      return;
    }

    toast.success(t("organizationPage.toasts.updateSuccess"));
    onUpdated();
  }

  return (
    <SettingsSection label={t("organizationPage.sections.workspace")}>
      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <Controller
            name="name"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field
                data-invalid={fieldState.invalid}
                className="min-w-0 flex-1"
              >
                <FieldLabel htmlFor="org-name">
                  <Required>
                    {t("organizationPage.profileForm.organizationName")}
                  </Required>
                </FieldLabel>
                <Input
                  {...field}
                  id="org-name"
                  placeholder={t("organizationPage.profileForm.namePlaceholder")}
                  required
                />
                {fieldState.invalid ? (
                  <FieldError errors={[fieldState.error]} />
                ) : null}
              </Field>
            )}
          />
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full shrink-0 sm:w-auto"
          >
            <LoadingSwap isLoading={isSubmitting}>
              {tCommon("actions.save")}
            </LoadingSwap>
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Controller
            name="country"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="org-country">
                  <Required>
                    {t("organizationPage.profileForm.country")}
                  </Required>
                </FieldLabel>
                <CountryCombobox
                  id="org-country"
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={isSubmitting}
                  placeholder={t("organizationPage.profileForm.countryPlaceholder")}
                  searchPlaceholder={t(
                    "organizationPage.profileForm.countrySearchPlaceholder",
                  )}
                  emptyMessage={t("organizationPage.profileForm.countryEmpty")}
                />
                {fieldState.invalid ? (
                  <FieldError errors={[fieldState.error]} />
                ) : null}
              </Field>
            )}
          />

          <Controller
            name="language"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="org-language">
                  <Required>
                    {t("organizationPage.profileForm.language")}
                  </Required>
                </FieldLabel>
                <OrganizationLanguageSelect
                  id="org-language"
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={isSubmitting}
                  placeholder={t("organizationPage.profileForm.languagePlaceholder")}
                />
                <FieldDescription>
                  {t("organizationPage.profileForm.languageDescription")}
                </FieldDescription>
                {fieldState.invalid ? (
                  <FieldError errors={[fieldState.error]} />
                ) : null}
              </Field>
            )}
          />
        </div>
      </form>
    </SettingsSection>
  );
}
