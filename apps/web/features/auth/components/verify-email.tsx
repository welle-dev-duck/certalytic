"use client";

import { useSearchParams } from "next/navigation";

import Link from "@/components/ui/link";
import { AuthPageHeading } from "@/features/auth/components/auth-page-heading";
import { EmailVerificationPanel } from "@/features/auth/components/email-verification-panel";
import { useTranslations } from "@/lib/i18n/client";
import { routes } from "@/lib/routes";

export function VerifyEmail() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email")?.trim() ?? "";
  const t = useTranslations("auth");

  if (!email) {
    return (
      <>
        <AuthPageHeading
          title={t("verifyEmail.missingTitle")}
          description={t("verifyEmail.missingDescription")}
        />
        <p className="text-sm text-muted-foreground">
          <Link href={routes.signIn()} className="font-medium hover:underline">
            {t("verifyEmail.returnToSignIn")}
          </Link>
        </p>
      </>
    );
  }

  return (
    <>
      <AuthPageHeading
        title={t("verifyEmail.title")}
        description={
          <>
            {t("verifyEmail.descriptionPrefix")}{" "}
            <span className="font-medium text-foreground">{email}</span>{" "}
            {t("verifyEmail.descriptionSuffix")}
          </>
        }
      />
      <EmailVerificationPanel email={email} />
    </>
  );
}
