"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

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
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import {
  signUpSchema,
  SignUpSchema,
} from "@/features/auth/schemas/sign-up-schema";

export function SignUpForm() {
  const router = useRouter();

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
          toast.error(error.error.message || "Something went wrong.");
        },
        onSuccess: () => {
          toast.success(
            "Account created successfully. Please verify your email.",
          );

          const q = new URLSearchParams({
            email: data.email,
          });

          router.push(`/auth/verify-email?${q.toString()}`);
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
                  <Required>Name</Required>
                </FieldLabel>

                <Input
                  {...field}
                  id="sign-up-form-name"
                  aria-invalid={fieldState.invalid}
                  required
                  placeholder="Max Mustermann"
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
                <FieldLabel htmlFor="sign-up-form-email">
                  <Required>Email</Required>
                </FieldLabel>

                <Input
                  {...field}
                  type="email"
                  id="sign-up-form-email"
                  aria-invalid={fieldState.invalid}
                  required
                  placeholder="max.mustermann@example.com"
                />

                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Controller
            name="password"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="sign-up-form-password">
                  <Required>Password</Required>
                </FieldLabel>

                <Input
                  {...field}
                  type="password"
                  id="sign-up-form-password"
                  aria-invalid={fieldState.invalid}
                  autoComplete="new-password"
                  placeholder="Password"
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
                <FieldLabel htmlFor="sign-up-form-confirm-password">
                  <Required>Confirm password</Required>
                </FieldLabel>

                <Input
                  {...field}
                  type="password"
                  id="sign-up-form-confirm-password"
                  aria-invalid={fieldState.invalid}
                  autoComplete="new-password"
                  placeholder="Confirm password"
                  required
                />

                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </FieldGroup>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="h-12 w-full rounded-md bg-primary text-base font-bold text-primary-foreground hover:bg-primary/90"
        >
          <LoadingSwap isLoading={isSubmitting}>Create account</LoadingSwap>
        </Button>
      </form>
    </div>
  );
}
