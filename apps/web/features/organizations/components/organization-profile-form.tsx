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
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  createOrganizationSettingsSchema,
  type OrganizationValues,
} from "@/features/organizations/schemas/organization-settings.schema";
import { authClient } from "@/lib/auth-client";
import { useTranslations } from "@/lib/i18n/client";

type OrganizationProfileFormProps = {
  organizationId: string;
  name: string;
  onUpdated: () => void;
};

export function OrganizationProfileForm({
  organizationId,
  name,
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
    values: { name },
  });

  const { isSubmitting } = form.formState;

  async function onSubmit(values: OrganizationValues) {
    const result = await authClient.organization.update({
      organizationId,
      data: {
        name: values.name,
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
      <form onSubmit={form.handleSubmit(onSubmit)}>
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
      </form>
    </SettingsSection>
  );
}
