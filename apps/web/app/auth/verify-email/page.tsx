import { Suspense } from "react";

import { VerifyEmail } from "./_components/verify-email";

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <p className="text-sm text-muted-foreground">Loading…</p>
      }
    >
      <VerifyEmail />
    </Suspense>
  );
}
