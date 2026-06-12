"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Field,
  FieldError,
  FieldLabel,
  FieldGroup,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Required } from "@/components/required";
import { Button } from "@/components/ui/button";
import { LoadingSwap } from "@/components/loading-swap";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "@/components/ui/link";
import {
  signInSchema,
  SignInSchema,
} from "@/features/auth/schemas/sign-in-schema";

export function SignInForm() {
  const router = useRouter();
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
      { ...data, callbackURL: "/" },
      {
        onError: (error) => {
          if (error.error.code === "EMAIL_NOT_VERIFIED") {
            const q = new URLSearchParams({ email: data.email });
            router.push(`/auth/verify-email?${q.toString()}`);
            return;
          }
          toast.error(error.error.message || "Something went wrong.");
        },

        onSuccess: () => {
          toast.success("Successfully signed in.");
          router.push("/");
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
                  <Required>Email</Required>
                </FieldLabel>
                <Input
                  {...field}
                  type="email"
                  id="sign-in-form-email"
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
                <FieldLabel htmlFor="sign-in-form-password">
                  <Required>Password</Required>
                </FieldLabel>
                <Input
                  {...field}
                  type="password"
                  id="sign-in-form-password"
                  aria-invalid={fieldState.invalid}
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
          <LoadingSwap isLoading={isSubmitting}>Sign in</LoadingSwap>
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Having trouble signing in? Contact our
        <Link
          href="/support"
          className="font-medium text-[#1264A3] hover:underline"
        >
          support team.
        </Link>
      </p>
    </div>
  );
}
