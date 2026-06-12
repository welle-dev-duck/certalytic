"use client";

import type { PropsWithChildren } from "react";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { AppSidebar } from "@/components/layout/app-sidebar";
import type { BreadcrumbItem } from "@/lib/routes";

type AppShellProps = PropsWithChildren<{
  breadcrumbs?: BreadcrumbItem[];
}>;

export function AppShell({ breadcrumbs = [], children }: AppShellProps) {
  return (
    <div className="flex h-dvh min-h-0 w-full min-w-0 flex-1 overflow-hidden bg-background">
      <AppSidebar />
      <main className="min-h-0 min-w-0 flex-1 overflow-x-clip overflow-y-auto overscroll-y-contain overscroll-x-none">
        <div className="mx-auto w-full max-w-full min-w-0">
          {breadcrumbs.length > 0 && (
            <div className="border-b border-border px-4 py-2 sm:px-6 sm:py-3">
              <Breadcrumbs breadcrumbs={breadcrumbs} />
            </div>
          )}
          {children}
        </div>
      </main>
    </div>
  );
}
