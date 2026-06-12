"use client";

import { useAuth } from "@/providers/auth-provider";

export function OrganizationSettings() {
  const { activeOrganization } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Organization</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Manage your active organization settings
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card p-6">
        <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
          Active organization
        </p>
        <p className="mt-2 text-lg font-semibold text-foreground">
          {activeOrganization?.name ?? "—"}
        </p>
        <p className="mt-1 font-mono text-xs text-muted-foreground">
          {activeOrganization?.slug}
        </p>
      </div>
    </div>
  );
}
