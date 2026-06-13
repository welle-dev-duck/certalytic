"use client";

import { OrganizationInviteForm } from "@/features/organizations/components/organization-invite-form";
import { OrganizationMembersList } from "@/features/organizations/components/organization-members-list";
import { OrganizationPendingInvitations } from "@/features/organizations/components/organization-pending-invitations";
import { OrganizationProfileForm } from "@/features/organizations/components/organization-profile-form";
import {
  useOrganizationInvitations,
  useOrganizationMembers,
} from "@/features/organizations/hooks/use-organization-directory";
import { useTranslations } from "@/lib/i18n/client";
import { useAuth } from "@/providers/auth-provider";

export function OrganizationSettings() {
  const { activeOrganization, refetchOrganizations } = useAuth();
  const t = useTranslations("settings");
  const orgId = activeOrganization?.id;

  const { data: members = [], isLoading: membersLoading } =
    useOrganizationMembers(orgId);
  const { data: invitations = [], isLoading: invitationsLoading } =
    useOrganizationInvitations(orgId);

  if (!activeOrganization || !orgId) {
    return (
      <p className="text-sm text-muted-foreground">
        {t("organizationPage.noOrganization")}
      </p>
    );
  }

  return (
    <div className="space-y-10">
      <div>
        <h2 className="text-lg font-semibold text-foreground">
          {t("organizationPage.title")}
        </h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {t("organizationPage.description", { name: activeOrganization.name })}
        </p>
      </div>

      <OrganizationProfileForm
        organizationId={orgId}
        name={activeOrganization.name}
        country={activeOrganization.country}
        language={activeOrganization.language}
        onUpdated={refetchOrganizations}
      />

      <OrganizationMembersList members={members} isLoading={membersLoading} />

      <OrganizationInviteForm organizationId={orgId} />

      <OrganizationPendingInvitations
        organizationId={orgId}
        invitations={invitations}
        isLoading={invitationsLoading}
      />
    </div>
  );
}
