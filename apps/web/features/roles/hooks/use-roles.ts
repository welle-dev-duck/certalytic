"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { useOrgId } from "@/features/organizations/hooks/use-org-id";
import { api } from "@/lib/api-client";
import type {
  PaginatedRoles,
  RoleDetail,
  RoleExportSummary,
  RoleListItem,
} from "@/features/roles/types";

export const roleKeys = {
  all: ["roles"] as const,
  lists: () => [...roleKeys.all, "list"] as const,
  list: (orgId: string | undefined, filters: Record<string, unknown>) =>
    [...roleKeys.lists(), orgId, filters] as const,
  detail: (orgId: string | undefined, id: string) =>
    [...roleKeys.all, "detail", orgId, id] as const,
  latestExport: (orgId: string | undefined, id: string) =>
    [...roleKeys.all, "latest-export", orgId, id] as const,
};

export type RoleListFilters = {
  limit?: number;
  cursor?: string;
  search?: string;
};

export function useRoles(
  filters: RoleListFilters = {},
  options?: { enabled?: boolean },
) {
  const orgId = useOrgId();
  const limit = filters.limit ?? 25;

  return useQuery({
    queryKey: roleKeys.list(orgId, { ...filters, limit }),
    queryFn: () =>
      api<PaginatedRoles<RoleListItem>>("/api/roles", {
        params: {
          limit,
          cursor: filters.cursor,
          search: filters.search,
        },
      }),
    enabled: (options?.enabled ?? true) && !!orgId,
  });
}

export function useRole(id: string) {
  const orgId = useOrgId();

  return useQuery({
    queryKey: roleKeys.detail(orgId, id),
    queryFn: () => api<RoleDetail>(`/api/roles/${id}`),
    enabled: !!id && !!orgId,
  });
}

export function useCreateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: { title: string; description?: string | null }) =>
      api<RoleDetail>("/api/roles", { method: "POST", body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleKeys.lists() });
    },
  });
}

export function useUpdateRole(id: string) {
  const queryClient = useQueryClient();
  const orgId = useOrgId();

  return useMutation({
    mutationFn: (body: { title?: string; description?: string | null }) =>
      api<RoleDetail>(`/api/roles/${id}`, { method: "PATCH", body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleKeys.detail(orgId, id) });
      queryClient.invalidateQueries({ queryKey: roleKeys.lists() });
    },
  });
}

export function useDeleteRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      api(`/api/roles/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleKeys.lists() });
    },
  });
}

export function useUploadRoleDocument(roleId: string) {
  const queryClient = useQueryClient();
  const orgId = useOrgId();

  return useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append("document", file);
      return api(`/api/roles/${roleId}/documents`, {
        method: "POST",
        body: formData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: roleKeys.detail(orgId, roleId),
      });
    },
  });
}

export function useRoleLatestExport(roleId: string) {
  const orgId = useOrgId();

  return useQuery({
    queryKey: roleKeys.latestExport(orgId, roleId),
    queryFn: () =>
      api<RoleExportSummary>(`/api/roles/${roleId}/exports/latest`),
    enabled: !!roleId && !!orgId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === "pending" || status === "processing") {
        return 3_000;
      }
      return false;
    },
  });
}

export function useRequestRoleExport(roleId: string) {
  const queryClient = useQueryClient();
  const orgId = useOrgId();

  return useMutation({
    mutationFn: () =>
      api<RoleExportSummary>(`/api/roles/${roleId}/export`, {
        method: "POST",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: roleKeys.latestExport(orgId, roleId),
      });
    },
  });
}

export type { RoleExportSummary };
