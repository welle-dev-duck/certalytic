import { Suspense } from "react";

import { AuthPageHeading } from "../_components/auth-page-heading";
import { ResetPasswordForm } from "./_components/reset-password-form";

export default function ResetPasswordPage() {
  return (
    <>
      <AuthPageHeading
        title="Reset password"
        description="Please enter your new password below"
      />
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
        <ResetPasswordForm />
      </Suspense>
    </>
  );
}
