"use client";

import { useSearchParams } from "next/navigation";

import { AuthPageHeading } from "../../_components/auth-page-heading";
import { Button } from "@/components/ui/button";
import Link from "@/components/ui/link";
import { EmailVerificationPanel } from "./panel";

export function VerifyEmail() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email")?.trim() ?? "";

  if (!email) {
    return (
      <>
        <AuthPageHeading
          title="Confirm your email"
          description="We sent you an email with a link to verify your email address."
        />
        <Button variant="secondary" asChild>
          <Link href="/auth/sign-in">
            Open this page from the sign-up or sign-in flow, or return to sign
            in and use the link from your inbox.
          </Link>
        </Button>
      </>
    );
  }

  return (
    <>
      <AuthPageHeading
        title="Confirm your email"
        description="Please check your email to verify your email address."
      />
      <EmailVerificationPanel email={email} />
    </>
  );
}
