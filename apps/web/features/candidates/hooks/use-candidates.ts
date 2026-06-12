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
  CandidateDetail,
  CandidateListItem,
  CandidateReport,
  PaginatedResponse,
} from "@/features/candidates/types";

export const candidateKeys = {
  all: ["candidates"] as const,
  lists: () => [...candidateKeys.all, "list"] as const,
  list: (orgId: string | undefined, filters: Record<string, unknown>) =>
    [...candidateKeys.lists(), orgId, filters] as const,
  detail: (orgId: string | undefined, id: string) =>
    [...candidateKeys.all, "detail", orgId, id] as const,
  report: (orgId: string | undefined, id: string) =>
    [...candidateKeys.all, "report", orgId, id] as const,
};

export type CandidateListFilters = {
  limit?: number;
  search?: string;
  role_id?: string;
  status?: string;
};

export function useCandidates(filters: CandidateListFilters) {
  const orgId = useOrgId();

  return useInfiniteQuery({
    queryKey: candidateKeys.list(orgId, filters),
    queryFn: ({ pageParam }) =>
      api<PaginatedResponse<CandidateListItem>>("/api/candidates", {
        params: {
          limit: filters.limit ?? 25,
          cursor: pageParam ?? undefined,
          search: filters.search,
          role_id: filters.role_id,
          status: filters.status,
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

export function useCandidate(id: string) {
  const orgId = useOrgId();

  return useQuery({
    queryKey: candidateKeys.detail(orgId, id),
    queryFn: () => api<CandidateDetail>(`/api/candidates/${id}`),
    enabled: !!id && !!orgId,
  });
}

export function useCandidateReport(id: string, enabled = true) {
  const orgId = useOrgId();

  return useQuery({
    queryKey: candidateKeys.report(orgId, id),
    queryFn: () => api<CandidateReport>(`/api/candidates/${id}/report`),
    enabled: !!id && !!orgId && enabled,
  });
}

export function useDeleteCandidate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      api(`/api/candidates/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: candidateKeys.lists() });
    },
  });
}

export function useRetryCandidate() {
  const queryClient = useQueryClient();
  const orgId = useOrgId();

  return useMutation({
    mutationFn: (id: string) =>
      api(`/api/candidates/${id}/retry`, { method: "POST" }),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({
        queryKey: candidateKeys.detail(orgId, id),
      });
      queryClient.invalidateQueries({ queryKey: candidateKeys.lists() });
    },
  });
}

export function useCreateCandidate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData: FormData) =>
      api<{ id: string }>("/api/candidates", {
        method: "POST",
        body: formData,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: candidateKeys.lists() });
    },
  });
}

export type ImportCandidateRow = {
  name: string;
  email?: string | null;
  transcript: string;
};

export function useImportCandidates() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: { role_id: string; rows: ImportCandidateRow[] }) =>
      api<{ queued: number }>("/api/candidates/import", {
        method: "POST",
        body,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: candidateKeys.lists() });
    },
  });
}
