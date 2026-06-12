"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useOrgId } from "@/features/organizations/hooks/use-org-id";
import { api } from "@/lib/api-client";
import { authClient } from "@/lib/auth-client";
import type { BillingUsage } from "@/features/billing/types";

const WEB_APP_URL = process.env.NEXT_PUBLIC_WEB_APP_URL ?? "http://localhost:3001";

export const billingKeys = {
  all: ["billing"] as const,
  usage: (orgId: string | undefined) =>
    [...billingKeys.all, "usage", orgId] as const,
};

export function useBillingUsage() {
  const orgId = useOrgId();

  return useQuery({
    queryKey: billingKeys.usage(orgId),
    queryFn: () => api<BillingUsage>("/api/billing/usage"),
    enabled: !!orgId,
  });
}

export function usePackCheckout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (pack: "quick_refill" | "pipeline_surge" | "high_volume_boost") =>
      api<{ url: string }>("/api/billing/packs/checkout", {
        method: "POST",
        body: { pack },
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: billingKeys.all });
      window.location.href = data.url;
    },
  });
}

export function useSubscriptionUpgrade() {
  const orgId = useOrgId();

  return useMutation({
    mutationFn: async (plan: "starter" | "growth" | "scale") => {
      if (!orgId) throw new Error("No active organization");

      const result = await authClient.subscription.upgrade({
        plan,
        referenceId: orgId,
        successUrl: `${WEB_APP_URL}/billing`,
        cancelUrl: `${WEB_APP_URL}/billing`,
        disableRedirect: false,
      });

      if (result.error) {
        throw new Error(result.error.message ?? "Checkout failed");
      }

      return result.data;
    },
  });
}

export function useBillingPortal() {
  const orgId = useOrgId();

  return useMutation({
    mutationFn: async () => {
      if (!orgId) throw new Error("No active organization");

      const result = await authClient.subscription.billingPortal({
        referenceId: orgId,
        returnUrl: `${WEB_APP_URL}/billing`,
        disableRedirect: false,
      });

      if (result.error) {
        throw new Error(result.error.message ?? "Could not open billing portal");
      }

      return result.data;
    },
  });
}
