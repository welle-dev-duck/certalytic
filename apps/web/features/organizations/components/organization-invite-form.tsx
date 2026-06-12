"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { UserPlus } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { LoadingSwap } from "@/components/loading-swap";
import { Required } from "@/components/required";
import { SettingsSection } from "@/components/settings/settings-section";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useInviteOrganizationMember } from "@/features/organizations/hooks/use-organization-directory";
import {
  inviteSchema,
  type InviteValues,
} from "@/features/organizations/schemas/organization-settings.schema";

type OrganizationInviteFormProps = {
  organizationId: string;
};

export function OrganizationInviteForm({
  organizationId,
}: OrganizationInviteFormProps) {
  const inviteMember = useInviteOrganizationMember(organizationId);

  const form = useForm<InviteValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: "",
      role: "member",
    },
  });

  const { isSubmitting } = form.formState;

  async function onInvite(values: InviteValues) {
    try {
      await inviteMember.mutateAsync(values);
      toast.success("Invitation sent.");
      form.reset({ email: "", role: values.role });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to send invitation.",
      );
    }
  }

  return (
    <SettingsSection label="INVITE MEMBER">
      <form onSubmit={form.handleSubmit(onInvite)}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <Controller
            name="email"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field
                data-invalid={fieldState.invalid}
                className="min-w-0 flex-1"
              >
                <FieldLabel htmlFor="invite-email">
                  <Required>Email</Required>
                </FieldLabel>
                <Input
                  {...field}
                  id="invite-email"
                  type="email"
                  placeholder="colleague@company.com"
                  required
                />
                {fieldState.invalid ? (
                  <FieldError errors={[fieldState.error]} />
                ) : null}
              </Field>
            )}
          />
          <Controller
            name="role"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field
                data-invalid={fieldState.invalid}
                className="w-full sm:w-40"
              >
                <FieldLabel htmlFor="invite-role">
                  <Required>Role</Required>
                </FieldLabel>
                <select
                  {...field}
                  id="invite-role"
                  className="h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30"
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
                {fieldState.invalid ? (
                  <FieldError errors={[fieldState.error]} />
                ) : null}
              </Field>
            )}
          />
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full shrink-0 sm:w-auto"
          >
            <LoadingSwap isLoading={isSubmitting}>
              <span className="flex items-center gap-1.5">
                <UserPlus size={14} />
                Send invitation
              </span>
            </LoadingSwap>
          </Button>
        </div>
      </form>
    </SettingsSection>
  );
}
