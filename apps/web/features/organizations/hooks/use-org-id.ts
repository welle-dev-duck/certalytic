"use client";

import { useAuth } from "@/providers/auth-provider";

export function useOrgId(): string | undefined {
  const { activeOrganization } = useAuth();
  return activeOrganization?.id;
}
