"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "@/components/ui/link";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { LoadingSwap } from "@/components/loading-swap";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { routes } from "@/lib/routes";

const forgotPasswordSchema = z.object({
  email: z.string().email("Enter a valid email address"),
});

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordForm() {
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
          toast.success("If an account exists, a reset link has been sent.");
        },
        onError: (error) => {
          toast.error(error.error.message || "Something went wrong.");
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
                  Email address
                </FieldLabel>
                <Input
                  {...field}
                  id="forgot-password-email"
                  type="email"
                  autoComplete="email"
                  placeholder="email@example.com"
                  required
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </FieldGroup>

        <Button type="submit" disabled={isSubmitting} className="h-12 w-full">
          <LoadingSwap isLoading={isSubmitting}>
            Email password reset link
          </LoadingSwap>
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Or, return to{" "}
        <Link href={routes.signIn()} className="font-medium hover:underline">
          log in
        </Link>
      </p>
    </div>
  );
}
