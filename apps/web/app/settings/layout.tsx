import type { ReactNode } from "react";

import { AppLayout } from "@/components/layout/app-layout";
import { SettingsNav } from "@/components/settings/settings-nav";

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl space-y-6 p-6">
        <SettingsNav />
        {children}
      </div>
    </AppLayout>
  );
}
