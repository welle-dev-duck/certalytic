import { Suspense } from "react";

import { VerifyEmail } from "@/features/auth/components";
import { getAuthPageMetadata } from "@/lib/seo/page-metadata";

export async function generateMetadata() {
  return getAuthPageMetadata("verifyEmail");
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmail />
    </Suspense>
  );
}
