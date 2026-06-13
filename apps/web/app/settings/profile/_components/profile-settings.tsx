"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "@/components/ui/link";
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
import { routes } from "@/lib/routes";
import { useAuth } from "@/providers/auth-provider";

type ProfileValues = {
  name: string;
  email: string;
};

export function ProfileSettings() {
  const { user } = useAuth();
  const t = useTranslations("settings");
  const tCommon = useTranslations("common");

  const profileSchema = useMemo(
    () =>
      z.object({
        name: z.string().trim().min(1, t("profilePage.validation.nameRequired")),
        email: z.string().email(t("profilePage.validation.emailInvalid")),
      }),
    [t],
  );

  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    values: {
      name: user?.name ?? "",
      email: user?.email ?? "",
    },
  });

  const { isSubmitting } = form.formState;
  const emailVerified = user?.emailVerified ?? false;

  async function onSubmit(values: ProfileValues) {
    const result = await authClient.updateUser({
      name: values.name,
      ...(values.email !== user?.email ? { email: values.email } : {}),
    });

    if (result.error) {
      toast.error(result.error.message ?? t("profilePage.toasts.updateFailed"));
      return;
    }

    toast.success(t("profilePage.toasts.updateSuccess"));
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">
          {t("profilePage.title")}
        </h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {t("profilePage.description")}
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FieldGroup>
          <Controller
            name="name"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="profile-name">
                  <Required>{t("profilePage.fields.name")}</Required>
                </FieldLabel>
                <Input
                  {...field}
                  id="profile-name"
                  autoComplete="name"
                  placeholder={t("profilePage.fields.namePlaceholder")}
                  required
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
          <Controller
            name="email"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="profile-email">
                  <Required>{t("profilePage.fields.email")}</Required>
                </FieldLabel>
                <Input
                  {...field}
                  id="profile-email"
                  type="email"
                  autoComplete="email"
                  placeholder={t("profilePage.fields.emailPlaceholder")}
                  required
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </FieldGroup>

        {!emailVerified && (
          <p className="text-sm text-muted-foreground">
            {t("profilePage.unverified")}{" "}
            <Link
              href={routes.verifyEmail()}
              className="font-medium text-foreground underline"
            >
              {t("profilePage.resendVerification")}
            </Link>
          </p>
        )}

        <Button type="submit" disabled={isSubmitting}>
          <LoadingSwap isLoading={isSubmitting}>
            {tCommon("actions.save")}
          </LoadingSwap>
        </Button>
      </form>
    </div>
  );
}
