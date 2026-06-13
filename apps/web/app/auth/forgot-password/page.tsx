import { AuthPageHeading, ForgotPasswordForm } from "@/features/auth/components";
import { getTranslations } from "@/lib/i18n/server";

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
