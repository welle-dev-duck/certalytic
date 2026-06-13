import { Suspense } from "react";

import { AuthPageHeading, SignInForm } from "@/features/auth/components";
import { getTranslations } from "@/lib/i18n/server";

export default async function SignIn() {
  const t = await getTranslations("auth");

  return (
    <>
      <AuthPageHeading
        title={t("signIn.title")}
        description={t("signIn.description")}
      />

      <Suspense fallback={null}>
        <SignInForm />
      </Suspense>
    </>
  );
}
