"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "@/components/ui/link"
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
import { useAuth } from "@/providers/auth-provider";

const profileSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().email("Enter a valid email"),
});

type ProfileValues = z.infer<typeof profileSchema>;

export function ProfileSettings() {
  const { user } = useAuth();

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
      toast.error(result.error.message ?? "Failed to update profile.");
      return;
    }

    toast.success("Profile updated.");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Profile</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Update your name and email address
        </p>
      </div>

      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4 rounded-lg border border-border bg-card p-6"
      >
        <FieldGroup>
          <Controller
            name="name"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="profile-name">Name</FieldLabel>
                <Input {...field} id="profile-name" autoComplete="name" />
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
                <FieldLabel htmlFor="profile-email">Email address</FieldLabel>
                <Input
                  {...field}
                  id="profile-email"
                  type="email"
                  autoComplete="email"
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
            Your email address is unverified.{" "}
            <Link
              href={routes.verifyEmail()}
              className="font-medium text-foreground underline"
            >
              Resend verification email
            </Link>
          </p>
        )}

        <Button type="submit" disabled={isSubmitting}>
          <LoadingSwap isLoading={isSubmitting}>Save</LoadingSwap>
        </Button>
      </form>
    </div>
  );
}
