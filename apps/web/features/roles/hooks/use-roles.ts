"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { useOrgId } from "@/features/organizations/hooks/use-org-id";
import { api } from "@/lib/api-client";
import type {
  PaginatedRoles,
  RoleDetail,
  RoleListItem,
} from "@/features/roles/types";

export const roleKeys = {
  all: ["roles"] as const,
  lists: () => [...roleKeys.all, "list"] as const,
  list: (orgId: string | undefined, filters: Record<string, unknown>) =>
    [...roleKeys.lists(), orgId, filters] as const,
  detail: (orgId: string | undefined, id: string) =>
    [...roleKeys.all, "detail", orgId, id] as const,
};

export function useRoles(filters: { limit?: number; search?: string } = {}) {
  const orgId = useOrgId();

  return useInfiniteQuery({
    queryKey: roleKeys.list(orgId, filters),
    queryFn: ({ pageParam }) =>
      api<PaginatedRoles<RoleListItem>>("/api/roles", {
        params: {
          limit: filters.limit ?? 100,
          cursor: pageParam ?? undefined,
          search: filters.search,
        },
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasNextPage
        ? (lastPage.pagination.nextCursor ?? undefined)
        : undefined,
    enabled: !!orgId,
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

export function useRequestRoleExport(roleId: string) {
  return useMutation({
    mutationFn: () =>
      api<{
        id: string;
        status: string;
        downloadUrl: string | null;
      }>(`/api/roles/${roleId}/export`, {
        method: "POST",
      }),
  });
}
