import { AuthPageHeading, ForgotPasswordForm } from "@/features/auth/components";
import { getAuthPageMetadata } from "@/lib/seo/page-metadata";
import { getTranslations } from "@/lib/i18n/server";

export async function generateMetadata() {
  return getAuthPageMetadata("forgotPassword");
}

export default async function ForgotPassword() {
  const t = await getTranslations("auth");

  return (
    <>
      <AuthPageHeading
        title={t("forgotPassword.title")}
        description={t("forgotPassword.description")}
      />
      <ForgotPasswordForm />
    </>
  );
}
