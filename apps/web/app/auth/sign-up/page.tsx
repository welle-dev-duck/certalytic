import { AuthPageHeading, SignUpForm } from "@/features/auth/components";
import { getAuthPageMetadata } from "@/lib/seo/page-metadata";
import { getTranslations } from "@/lib/i18n/server";

export async function generateMetadata() {
  return getAuthPageMetadata("signUp");
}

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
