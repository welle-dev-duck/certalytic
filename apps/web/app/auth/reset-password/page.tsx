import { Suspense } from "react";

import { AuthPageHeading, ResetPasswordForm } from "@/features/auth/components";

export default function ResetPassword() {
  return (
    <>
      <AuthPageHeading
        title="Reset your password"
        description="Choose a new password for your account."
      />
      <Suspense fallback={null}>
        <ResetPasswordForm />
      </Suspense>
    </>
  );
}
