import { Suspense } from "react";

import { AuthPageHeading, ResetPasswordForm } from "@/features/auth/components";
import { getAuthPageMetadata } from "@/lib/seo/page-metadata";
import { getTranslations } from "@/lib/i18n/server";

export async function generateMetadata() {
  return getAuthPageMetadata("resetPassword");
}

export default async function ResetPassword() {
  const t = await getTranslations("auth");

  return (
    <>
      <AuthPageHeading
        title={t("resetPassword.title")}
        description={t("resetPassword.description")}
      />
      <Suspense fallback={null}>
        <ResetPasswordForm />
      </Suspense>
    </>
  );
}
