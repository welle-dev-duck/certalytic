"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, UserPlus, X } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

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
  useCancelOrganizationInvitation,
  useInviteOrganizationMember,
  useOrganizationInvitations,
  useOrganizationMembers,
} from "@/features/organizations/hooks/use-organization-directory";
import { authClient } from "@/lib/auth-client";
import { useAuth } from "@/providers/auth-provider";

const organizationSchema = z.object({
  name: z.string().trim().min(1, "Organization name is required").max(100),
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required")
    .max(100)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Use lowercase letters, numbers, and hyphens only",
    ),
});

const inviteSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  role: z.enum(["member", "admin"]),
});

type OrganizationValues = z.infer<typeof organizationSchema>;
type InviteValues = z.infer<typeof inviteSchema>;

function formatRole(role: string): string {
  return role.charAt(0).toUpperCase() + role.slice(1);
}

export function OrganizationSettings() {
  const { activeOrganization, refetchOrganizations } = useAuth();
  const orgId = activeOrganization?.id;

  const { data: members = [], isLoading: membersLoading } =
    useOrganizationMembers(orgId);
  const { data: invitations = [], isLoading: invitationsLoading } =
    useOrganizationInvitations(orgId);

  const inviteMember = useInviteOrganizationMember(orgId ?? "");
  const cancelInvitation = useCancelOrganizationInvitation(orgId ?? "");

  const form = useForm<OrganizationValues>({
    resolver: zodResolver(organizationSchema),
    values: {
      name: activeOrganization?.name ?? "",
      slug: activeOrganization?.slug ?? "",
    },
  });

  const inviteForm = useForm<InviteValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: "",
      role: "member",
    },
  });

  const { isSubmitting } = form.formState;
  const { isSubmitting: isInviting } = inviteForm.formState;

  if (!activeOrganization) {
    return (
      <p className="text-sm text-muted-foreground">
        Select or create an organization to manage its settings.
      </p>
    );
  }

  async function onSubmit(values: OrganizationValues) {
    const result = await authClient.organization.update({
      organizationId: activeOrganization!.id,
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
    refetchOrganizations();
  }

  async function onInvite(values: InviteValues) {
    try {
      await inviteMember.mutateAsync(values);
      toast.success("Invitation sent.");
      inviteForm.reset({ email: "", role: values.role });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to send invitation.",
      );
    }
  }

  async function handleCancelInvitation(invitationId: string) {
    try {
      await cancelInvitation.mutateAsync(invitationId);
      toast.success("Invitation cancelled.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to cancel invitation.",
      );
    }
  }

  return (
    <div className="space-y-10">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Organization</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {activeOrganization.name} — workspace name, members, and invitations
        </p>
      </div>

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
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
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
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FieldGroup>

          <Button type="submit" disabled={isSubmitting}>
            <LoadingSwap isLoading={isSubmitting}>Save</LoadingSwap>
          </Button>
        </form>
      </SettingsSection>

      <SettingsSection label="TEAM MEMBERS">
        {membersLoading ? (
          <p className="text-sm text-muted-foreground">Loading members…</p>
        ) : members.length === 0 ? (
          <p className="text-sm text-muted-foreground">No members yet.</p>
        ) : (
          <div className="space-y-3">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">
                    {member.user.name}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {member.user.email}
                  </p>
                </div>
                <span className="shrink-0 rounded bg-muted px-2 py-1 text-[10px] font-bold tracking-wide text-muted-foreground uppercase">
                  {formatRole(member.role)}
                </span>
              </div>
            ))}
          </div>
        )}
      </SettingsSection>

      <SettingsSection label="INVITE MEMBER">
        <form onSubmit={inviteForm.handleSubmit(onInvite)}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <Controller
              name="email"
              control={inviteForm.control}
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
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="role"
              control={inviteForm.control}
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
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Button
              type="submit"
              disabled={isInviting}
              className="w-full shrink-0 sm:w-auto"
            >
              <LoadingSwap isLoading={isInviting}>
                <span className="flex items-center gap-1.5">
                  <UserPlus size={14} />
                  Send invitation
                </span>
              </LoadingSwap>
            </Button>
          </div>
        </form>
      </SettingsSection>

      <SettingsSection label="PENDING INVITATIONS">
        {invitationsLoading ? (
          <p className="text-sm text-muted-foreground">Loading invitations…</p>
        ) : invitations.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No pending invitations.
          </p>
        ) : (
          <div className="space-y-3">
            {invitations.map((invitation) => (
              <div
                key={invitation.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border px-4 py-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted">
                    <Mail size={14} className="text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {invitation.email}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatRole(invitation.role)} · {invitation.status}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="shrink-0 text-destructive hover:text-destructive"
                  disabled={cancelInvitation.isPending}
                  onClick={() => void handleCancelInvitation(invitation.id)}
                >
                  <X size={14} />
                  <span className="sr-only">Cancel invitation</span>
                </Button>
              </div>
            ))}
          </div>
        )}
      </SettingsSection>
    </div>
  );
}
