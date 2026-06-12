"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useOrgId } from "@/features/organizations/hooks/use-org-id";
import type {
  OrganizationInvitation,
  OrganizationMember,
} from "@/features/organizations/types";
import { authClient } from "@/lib/auth-client";

export const organizationDirectoryKeys = {
  all: ["organization-directory"] as const,
  members: (orgId: string | undefined) =>
    [...organizationDirectoryKeys.all, "members", orgId] as const,
  invitations: (orgId: string | undefined) =>
    [...organizationDirectoryKeys.all, "invitations", orgId] as const,
};

type ListMembersEnvelope = {
  members: OrganizationMember[];
};

function isOrganizationMember(value: unknown): value is OrganizationMember {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    "role" in value &&
    typeof (value as OrganizationMember).id === "string" &&
    typeof (value as OrganizationMember).role === "string" &&
    "user" in value &&
    typeof (value as OrganizationMember).user === "object" &&
    (value as OrganizationMember).user !== null
  );
}

function isOrganizationInvitation(
  value: unknown,
): value is OrganizationInvitation {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    "email" in value &&
    typeof (value as OrganizationInvitation).id === "string" &&
    typeof (value as OrganizationInvitation).email === "string"
  );
}

function parseMembersResponse(data: unknown): OrganizationMember[] {
  if (!data) return [];

  if (Array.isArray(data)) {
    return data.filter(isOrganizationMember);
  }

  if (
    typeof data === "object" &&
    data !== null &&
    "members" in data &&
    Array.isArray((data as ListMembersEnvelope).members)
  ) {
    return (data as ListMembersEnvelope).members.filter(isOrganizationMember);
  }

  return [];
}

function parseInvitationsResponse(data: unknown): OrganizationInvitation[] {
  if (!Array.isArray(data)) return [];
  return data.filter(isOrganizationInvitation);
}

export function useOrganizationMembers(organizationId?: string) {
  const orgId = useOrgId();
  const resolvedOrgId = organizationId ?? orgId;

  return useQuery({
    queryKey: organizationDirectoryKeys.members(resolvedOrgId),
    queryFn: async () => {
      const result = await authClient.organization.listMembers({
        query: {
          organizationId: resolvedOrgId!,
          limit: 100,
          offset: 0,
        },
      });

      if (result.error) {
        throw new Error(result.error.message ?? "Failed to load members.");
      }

      return parseMembersResponse(result.data);
    },
    enabled: !!resolvedOrgId,
  });
}

export function useOrganizationInvitations(organizationId?: string) {
  const orgId = useOrgId();
  const resolvedOrgId = organizationId ?? orgId;

  return useQuery({
    queryKey: organizationDirectoryKeys.invitations(resolvedOrgId),
    queryFn: async () => {
      const result = await authClient.organization.listInvitations({
        query: {
          organizationId: resolvedOrgId!,
        },
      });

      if (result.error) {
        throw new Error(result.error.message ?? "Failed to load invitations.");
      }

      return parseInvitationsResponse(result.data);
    },
    enabled: !!resolvedOrgId,
  });
}

export function useInviteOrganizationMember(organizationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { email: string; role: "member" | "admin" }) => {
      const result = await authClient.organization.inviteMember({
        email: input.email,
        role: input.role,
        organizationId,
        resend: true,
      });

      if (result.error) {
        throw new Error(result.error.message ?? "Failed to send invitation.");
      }

      return result.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: organizationDirectoryKeys.invitations(organizationId),
      });
    },
  });
}

export function useCancelOrganizationInvitation(organizationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invitationId: string) => {
      const result = await authClient.organization.cancelInvitation({
        invitationId,
      });

      if (result.error) {
        throw new Error(result.error.message ?? "Failed to cancel invitation.");
      }

      return result.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: organizationDirectoryKeys.invitations(organizationId),
      });
    },
  });
}
