"use client";

import type { ReactNode } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { OrgGuard } from "@/components/layout/org-guard";

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <OrgGuard>
      <AppShell>{children}</AppShell>
    </OrgGuard>
  );
}
