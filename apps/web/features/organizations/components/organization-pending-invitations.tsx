"use client";

import { Mail, X } from "lucide-react";
import { toast } from "sonner";

import { SettingsSection } from "@/components/settings/settings-section";
import { Button } from "@/components/ui/button";
import { useCancelOrganizationInvitation } from "@/features/organizations/hooks/use-organization-directory";
import { formatOrganizationRole } from "@/features/organizations/schemas/organization-settings.schema";
import type { OrganizationInvitation } from "@/features/organizations/types";
import { useTranslations } from "@/lib/i18n/client";

type OrganizationPendingInvitationsProps = {
  organizationId: string;
  invitations: OrganizationInvitation[];
  isLoading: boolean;
};

export function OrganizationPendingInvitations({
  organizationId,
  invitations,
  isLoading,
}: OrganizationPendingInvitationsProps) {
  const t = useTranslations("settings");
  const cancelInvitation = useCancelOrganizationInvitation(organizationId);

  async function handleCancelInvitation(invitationId: string) {
    try {
      await cancelInvitation.mutateAsync(invitationId);
      toast.success(t("organizationPage.toasts.cancelSuccess"));
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t("organizationPage.toasts.cancelFailed"),
      );
    }
  }

  return (
    <SettingsSection label={t("organizationPage.sections.pendingInvitations")}>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">
          {t("organizationPage.pendingInvitations.loading")}
        </p>
      ) : invitations.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {t("organizationPage.pendingInvitations.empty")}
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
                    {formatOrganizationRole(t, invitation.role)} ·{" "}
                    {invitation.status}
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
                <span className="sr-only">
                  {t("organizationPage.pendingInvitations.cancelAriaLabel")}
                </span>
              </Button>
            </div>
          ))}
        </div>
      )}
    </SettingsSection>
  );
}
