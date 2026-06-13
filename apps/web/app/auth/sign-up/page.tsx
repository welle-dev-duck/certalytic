import { AuthPageHeading, SignUpForm } from "@/features/auth/components";
import { getTranslations } from "@/lib/i18n/server";

export default async function SignUp() {
  const t = await getTranslations("auth");

  return (
    <>
      <AuthPageHeading
        title={t("signUp.title")}
        description={t("signUp.description")}
      />
      <SignUpForm />
    </>
  );
}
