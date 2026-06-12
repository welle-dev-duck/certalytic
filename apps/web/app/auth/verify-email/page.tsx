import { Suspense } from "react";

import { VerifyEmail } from "@/features/auth/components";

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmail />
    </Suspense>
  );
}
