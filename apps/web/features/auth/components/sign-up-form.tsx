"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Required } from "@/components/required";
import { Button } from "@/components/ui/button";
import Link from "@/components/ui/link";
import { LoadingSwap } from "@/components/loading-swap";
import {
  signUpSchema,
  type SignUpSchema,
} from "@/features/auth/schemas/sign-up-schema";
import { authClient } from "@/lib/auth-client";
import { useTranslations } from "@/lib/i18n/client";
import { routes } from "@/lib/routes";

export function SignUpForm() {
  const router = useRouter();
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");

  const form = useForm<SignUpSchema>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const { isSubmitting } = form.formState;

  async function handleSignUp(data: SignUpSchema) {
    await authClient.signUp.email(
      {
        name: data.name,
        email: data.email,
        password: data.password,
        callbackURL: process.env.NEXT_PUBLIC_WEB_APP_DASHBOARD_URL,
      },
      {
        onError: (error) => {
          toast.error(error.error.message || tCommon("errors.generic"));
        },
        onSuccess: () => {
          toast.success(t("signUp.success"));
          router.push(`/auth/verify-email?email=${encodeURIComponent(data.email)}`);
        },
      },
    );
  }

  return (
    <div className="space-y-6">
      <form className="space-y-4" onSubmit={form.handleSubmit(handleSignUp)}>
        <FieldGroup>
          <Controller
            name="name"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="sign-up-form-name">
                  <Required>{t("signUp.name")}</Required>
                </FieldLabel>
                <Input
                  {...field}
                  id="sign-up-form-name"
                  aria-invalid={fieldState.invalid}
                  required
                  placeholder={t("placeholders.name")}
                />
                {fieldState.invalid ? (
                  <FieldError errors={[fieldState.error]} />
                ) : null}
              </Field>
            )}
          />
          <Controller
            name="email"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="sign-up-form-email">
                  <Required>{t("signUp.email")}</Required>
                </FieldLabel>
                <Input
                  {...field}
                  type="email"
                  id="sign-up-form-email"
                  aria-invalid={fieldState.invalid}
                  required
                  placeholder={t("placeholders.email")}
                />
                {fieldState.invalid ? (
                  <FieldError errors={[fieldState.error]} />
                ) : null}
              </Field>
            )}
          />
          <Controller
            name="password"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="sign-up-form-password">
                  <Required>{t("signUp.password")}</Required>
                </FieldLabel>
                <Input
                  {...field}
                  type="password"
                  id="sign-up-form-password"
                  aria-invalid={fieldState.invalid}
                  autoComplete="new-password"
                  placeholder={t("placeholders.password")}
                  required
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
                <FieldLabel htmlFor="sign-up-form-confirm-password">
                  <Required>{t("signUp.confirmPassword")}</Required>
                </FieldLabel>
                <Input
                  {...field}
                  type="password"
                  id="sign-up-form-confirm-password"
                  aria-invalid={fieldState.invalid}
                  autoComplete="new-password"
                  placeholder={t("placeholders.confirmPassword")}
                  required
                />
                {fieldState.invalid ? (
                  <FieldError errors={[fieldState.error]} />
                ) : null}
              </Field>
            )}
          />
        </FieldGroup>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="h-12 w-full rounded-md bg-primary text-base font-bold text-primary-foreground hover:bg-primary/90"
        >
          <LoadingSwap isLoading={isSubmitting}>
            {t("signUp.submit")}
          </LoadingSwap>
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          {t("signUp.hasAccount")}{" "}
          <Link href={routes.signIn()} className="font-medium hover:underline">
            {t("signUp.signInLink")}
          </Link>
        </p>
      </form>
    </div>
  );
}
