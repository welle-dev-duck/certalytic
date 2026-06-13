"use client";

import { useQuery } from "@tanstack/react-query";

import { useOrgId } from "@/features/organizations/hooks/use-org-id";
import { api } from "@/lib/api-client";

export type DashboardStats = {
  totalRoles: number;
  totalCandidates: number;
  highRiskFlagged: number;
  mediumRiskFlagged: number;
  avgIntegrityScore: number | null;
};

export const dashboardKeys = {
  all: ["dashboard"] as const,
  stats: (orgId: string | undefined) =>
    [...dashboardKeys.all, "stats", orgId] as const,
};

export function useDashboardStats() {
  const orgId = useOrgId();

  return useQuery({
    queryKey: dashboardKeys.stats(orgId),
    queryFn: () => api<DashboardStats>("/api/dashboard/stats"),
    enabled: !!orgId,
  });
}
