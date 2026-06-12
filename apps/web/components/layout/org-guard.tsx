"use client";

import { NoOrganizationPanel } from "@/components/layout/no-organization-panel";
import { useAuth } from "@/providers/auth-provider";

export function OrgGuard({ children }: { children: React.ReactNode }) {
  const { isLoading, activeOrganization, organizations } = useAuth();

  if (isLoading) return null;

  if (!activeOrganization && organizations.length === 0) {
    return <NoOrganizationPanel />;
  }

  return children;
}
