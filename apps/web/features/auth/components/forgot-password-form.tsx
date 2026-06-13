"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "@/components/ui/link";
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
  forgotPasswordSchema,
  type ForgotPasswordValues,
} from "@/features/auth/schemas/forgot-password-schema";
import { authClient } from "@/lib/auth-client";
import { useTranslations } from "@/lib/i18n/client";
import { routes } from "@/lib/routes";

export function ForgotPasswordForm() {
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");

  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const { isSubmitting } = form.formState;

  async function onSubmit(data: ForgotPasswordValues) {
    await authClient.requestPasswordReset(
      {
        email: data.email,
        redirectTo: `${process.env.NEXT_PUBLIC_WEB_APP_URL}/auth/reset-password`,
      },
      {
        onSuccess: () => {
          toast.success(t("forgotPassword.success"));
        },
        onError: (error) => {
          toast.error(error.error.message || tCommon("errors.generic"));
        },
      },
    );
  }

  return (
    <div className="space-y-6">
      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        <FieldGroup>
          <Controller
            name="email"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="forgot-password-email">
                  {t("forgotPassword.email")}
                </FieldLabel>
                <Input
                  {...field}
                  id="forgot-password-email"
                  type="email"
                  autoComplete="email"
                  placeholder={t("placeholders.email")}
                  required
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
            {t("forgotPassword.submit")}
          </LoadingSwap>
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        {t("forgotPassword.backToSignIn")}{" "}
        <Link href={routes.signIn()} className="font-medium hover:underline">
          {t("forgotPassword.signInLink")}
        </Link>
      </p>
    </div>
  );
}
