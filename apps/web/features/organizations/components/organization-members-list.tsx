"use client";

import { SettingsSection } from "@/components/settings/settings-section";
import { formatOrganizationRole } from "@/features/organizations/schemas/organization-settings.schema";
import type { OrganizationMember } from "@/features/organizations/types";

type OrganizationMembersListProps = {
  members: OrganizationMember[];
  isLoading: boolean;
};

export function OrganizationMembersList({
  members,
  isLoading,
}: OrganizationMembersListProps) {
  return (
    <SettingsSection label="TEAM MEMBERS">
      {isLoading ? (
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
                {formatOrganizationRole(member.role)}
              </span>
            </div>
          ))}
        </div>
      )}
    </SettingsSection>
  );
}
