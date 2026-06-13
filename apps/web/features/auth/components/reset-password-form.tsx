"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { LoadingSwap } from "@/components/loading-swap";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  resetPasswordSchema,
  type ResetPasswordValues,
} from "@/features/auth/schemas/reset-password-schema";
import { authClient } from "@/lib/auth-client";
import { useTranslations } from "@/lib/i18n/client";
import { routes } from "@/lib/routes";

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");

  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const { isSubmitting } = form.formState;

  async function onSubmit(values: ResetPasswordValues) {
    if (!token) {
      toast.error(t("resetPassword.missingToken"));
      return;
    }

    const result = await authClient.resetPassword({
      newPassword: values.password,
      token,
    });

    if (result.error) {
      toast.error(result.error.message ?? tCommon("errors.generic"));
      return;
    }

    toast.success(t("resetPassword.success"));
    router.replace(routes.signIn());
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <FieldGroup>
        <Controller
          name="password"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="reset-password">
                {t("resetPassword.password")}
              </FieldLabel>
              <Input
                {...field}
                id="reset-password"
                type="password"
                autoComplete="new-password"
                placeholder={t("placeholders.password")}
                autoFocus
              />
              {fieldState.invalid ? (
                <FieldError errors={[fieldState.error]} />
              ) : null}
            </Field>
          )}
        />
        <Controller
          name="confirmPassword"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="reset-confirm-password">
                {t("resetPassword.confirmPassword")}
              </FieldLabel>
              <Input
                {...field}
                id="reset-confirm-password"
                type="password"
                autoComplete="new-password"
                placeholder={t("placeholders.confirmPassword")}
              />
              {fieldState.invalid ? (
                <FieldError errors={[fieldState.error]} />
              ) : null}
            </Field>
          )}
        />
      </FieldGroup>

      <Button type="submit" disabled={isSubmitting} className="h-12 w-full">
        <LoadingSwap isLoading={isSubmitting}>
          {t("resetPassword.submit")}
        </LoadingSwap>
      </Button>
    </form>
  );
}
