import { Suspense } from "react";

import { AuthPageHeading, SignInForm } from "@/features/auth/components";

export default async function SignIn() {
  return (
    <>
      <AuthPageHeading
        title="Log in to your account"
        description="Enter your email and password below to log in"
      />

      <Suspense fallback={null}>
        <SignInForm />
      </Suspense>
    </>
  );
}
