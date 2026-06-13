"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { LoadingSwap } from "@/components/loading-swap";
import { Required } from "@/components/required";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { useTranslations } from "@/lib/i18n/client";

type SecurityValues = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export function SecuritySettings() {
  const t = useTranslations("settings");
  const tCommon = useTranslations("common");

  const securitySchema = useMemo(
    () =>
      z
        .object({
          currentPassword: z
            .string()
            .min(1, t("securityPage.validation.currentPasswordRequired")),
          newPassword: z
            .string()
            .min(8, t("securityPage.validation.newPasswordMinLength")),
          confirmPassword: z
            .string()
            .min(1, t("securityPage.validation.confirmPasswordRequired")),
        })
        .refine((data) => data.newPassword === data.confirmPassword, {
          message: t("securityPage.validation.passwordsMismatch"),
          path: ["confirmPassword"],
        }),
    [t],
  );

  const form = useForm<SecurityValues>({
    resolver: zodResolver(securitySchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const { isSubmitting } = form.formState;

  async function onSubmit(values: SecurityValues) {
    const result = await authClient.changePassword({
      currentPassword: values.currentPassword,
      newPassword: values.newPassword,
      revokeOtherSessions: true,
    });

    if (result.error) {
      toast.error(
        result.error.message ?? t("securityPage.toasts.updateFailed"),
      );
      return;
    }

    toast.success(t("securityPage.toasts.updateSuccess"));
    form.reset();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">
          {t("securityPage.title")}
        </h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {t("securityPage.description")}
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FieldGroup>
          <Controller
            name="currentPassword"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="current-password">
                  <Required>
                    {t("securityPage.fields.currentPassword")}
                  </Required>
                </FieldLabel>
                <Input
                  {...field}
                  id="current-password"
                  type="password"
                  autoComplete="current-password"
                  placeholder={t(
                    "securityPage.fields.currentPasswordPlaceholder",
                  )}
                  required
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
          <Controller
            name="newPassword"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="new-password">
                  <Required>{t("securityPage.fields.newPassword")}</Required>
                </FieldLabel>
                <Input
                  {...field}
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  placeholder={t("securityPage.fields.newPasswordPlaceholder")}
                  required
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
          <Controller
            name="confirmPassword"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="confirm-password">
                  <Required>
                    {t("securityPage.fields.confirmPassword")}
                  </Required>
                </FieldLabel>
                <Input
                  {...field}
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  placeholder={t(
                    "securityPage.fields.confirmPasswordPlaceholder",
                  )}
                  required
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </FieldGroup>

        <Button type="submit" disabled={isSubmitting}>
          <LoadingSwap isLoading={isSubmitting}>
            {tCommon("actions.save")}
          </LoadingSwap>
        </Button>
      </form>
    </div>
  );
}
