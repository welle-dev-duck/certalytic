"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
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
import { LoadingSwap } from "@/components/loading-swap";
import Link from "@/components/ui/link";
import {
  signInSchema,
  type SignInSchema,
} from "@/features/auth/schemas/sign-in-schema";
import { authClient } from "@/lib/auth-client";
import { useTranslations } from "@/lib/i18n/client";
import { routes } from "@/lib/routes";

export function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");
  const callbackURL =
    searchParams.get("callbackURL") ??
    process.env.NEXT_PUBLIC_WEB_APP_DASHBOARD_URL;
  const form = useForm<SignInSchema>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const { isSubmitting } = form.formState;

  async function handleSignIn(data: SignInSchema) {
    await authClient.signIn.email(
      { ...data, callbackURL },
      {
        onError: (error) => {
          if (error.error.code === "EMAIL_NOT_VERIFIED") {
            const q = new URLSearchParams({ email: data.email });
            router.push(`/auth/verify-email?${q.toString()}`);
            return;
          }
          toast.error(error.error.message || tCommon("errors.generic"));
        },
        onSuccess: () => {
          toast.success(t("signIn.success"));
          router.refresh();
        },
      },
    );
  }

  return (
    <div className="space-y-6">
      <form className="space-y-4" onSubmit={form.handleSubmit(handleSignIn)}>
        <FieldGroup>
          <Controller
            name="email"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="sign-in-form-email">
                  <Required>{t("signIn.email")}</Required>
                </FieldLabel>
                <Input
                  {...field}
                  type="email"
                  id="sign-in-form-email"
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
                <div className="flex w-full items-center justify-between gap-2">
                  <FieldLabel htmlFor="sign-in-form-password">
                    <Required>{t("signIn.password")}</Required>
                  </FieldLabel>
                  <Link
                    href={routes.forgotPassword()}
                    className="text-xs text-muted-foreground hover:text-foreground hover:underline"
                  >
                    {t("signIn.forgotPassword")}
                  </Link>
                </div>
                <Input
                  {...field}
                  type="password"
                  id="sign-in-form-password"
                  aria-invalid={fieldState.invalid}
                  autoComplete="current-password"
                  placeholder={t("placeholders.password")}
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
            {t("signIn.submit")}
          </LoadingSwap>
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          {t("signIn.noAccount")}{" "}
          <Link href={routes.signUp()} className="font-medium hover:underline">
            {t("signIn.signUpLink")}
          </Link>
        </p>
      </form>
    </div>
  );
}
