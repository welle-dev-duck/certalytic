"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { LoadingSwap } from "@/components/loading-swap";
import { Required } from "@/components/required";
import { SettingsSection } from "@/components/settings/settings-section";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  organizationSchema,
  type OrganizationValues,
} from "@/features/organizations/schemas/organization-settings.schema";
import { authClient } from "@/lib/auth-client";

type OrganizationProfileFormProps = {
  organizationId: string;
  name: string;
  slug: string;
  onUpdated: () => void;
};

export function OrganizationProfileForm({
  organizationId,
  name,
  slug,
  onUpdated,
}: OrganizationProfileFormProps) {
  const form = useForm<OrganizationValues>({
    resolver: zodResolver(organizationSchema),
    values: { name, slug },
  });

  const { isSubmitting } = form.formState;

  async function onSubmit(values: OrganizationValues) {
    const result = await authClient.organization.update({
      organizationId,
      data: {
        name: values.name,
        slug: values.slug,
      },
    });

    if (result.error) {
      toast.error(result.error.message ?? "Failed to update organization.");
      return;
    }

    toast.success("Organization updated.");
    onUpdated();
  }

  return (
    <SettingsSection label="WORKSPACE">
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FieldGroup>
          <Controller
            name="name"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="org-name">
                  <Required>Organization name</Required>
                </FieldLabel>
                <Input
                  {...field}
                  id="org-name"
                  placeholder="Acme Hiring"
                  required
                />
                {fieldState.invalid ? (
                  <FieldError errors={[fieldState.error]} />
                ) : null}
              </Field>
            )}
          />
          <Controller
            name="slug"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="org-slug">
                  <Required>Slug</Required>
                </FieldLabel>
                <Input
                  {...field}
                  id="org-slug"
                  placeholder="acme-hiring"
                  required
                />
                {fieldState.invalid ? (
                  <FieldError errors={[fieldState.error]} />
                ) : null}
              </Field>
            )}
          />
        </FieldGroup>

        <Button type="submit" disabled={isSubmitting}>
          <LoadingSwap isLoading={isSubmitting}>Save</LoadingSwap>
        </Button>
      </form>
    </SettingsSection>
  );
}
