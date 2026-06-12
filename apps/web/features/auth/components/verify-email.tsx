"use client";

import { useSearchParams } from "next/navigation";

import Link from "@/components/ui/link";
import { AuthPageHeading } from "@/features/auth/components/auth-page-heading";
import { EmailVerificationPanel } from "@/features/auth/components/email-verification-panel";
import { routes } from "@/lib/routes";

export function VerifyEmail() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email")?.trim() ?? "";

  if (!email) {
    return (
      <>
        <AuthPageHeading
          title="Email verification"
          description="Open this page from sign-up or sign-in after registering. We need your email address to send a verification link."
        />
        <p className="text-sm text-muted-foreground">
          <Link href={routes.signIn()} className="font-medium hover:underline">
            Return to sign in
          </Link>
        </p>
      </>
    );
  }

  return (
    <>
      <AuthPageHeading
        title="Check your inbox"
        description={
          <>
            To activate your account, please check your email at{" "}
            <span className="font-medium text-foreground">{email}</span> and
            click the link to verify your email address.
          </>
        }
      />
      <EmailVerificationPanel email={email} />
    </>
  );
}
