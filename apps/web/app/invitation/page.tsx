import { Suspense } from "react";

import { InvitationPanel } from "./_components/invitation-panel";

export default function InvitationPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center text-sm text-muted-foreground">
          Loading invitation…
        </div>
      }
    >
      <InvitationPanel />
    </Suspense>
  );
}
