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

function normalizeMembers(data: unknown): OrganizationMember[] {
  if (!data) return [];

  const members =
    typeof data === "object" &&
    data !== null &&
    "members" in data &&
    Array.isArray((data as { members: unknown }).members)
      ? (data as { members: OrganizationMember[] }).members
      : Array.isArray(data)
        ? (data as OrganizationMember[])
        : [];

  return members;
}

function normalizeInvitations(data: unknown): OrganizationInvitation[] {
  if (!data) return [];
  return Array.isArray(data) ? (data as OrganizationInvitation[]) : [];
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

      return normalizeMembers(result.data);
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

      return normalizeInvitations(result.data);
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
