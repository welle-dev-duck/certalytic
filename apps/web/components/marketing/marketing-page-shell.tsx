import type { ReactNode } from "react";

import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { MarketingHeader } from "@/components/marketing/marketing-header";

export function MarketingPageShell({ children }: { children: ReactNode }) {
  return (
    <div className="h-dvh min-h-0 overflow-x-clip overflow-y-auto overscroll-y-contain bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-size-[4rem_4rem] mask-[radial-gradient(ellipse_at_top,black,transparent_70%)] opacity-40" />
      <MarketingHeader />
      {children}
      <MarketingFooter />
    </div>
  );
}
