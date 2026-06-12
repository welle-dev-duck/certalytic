import { Suspense } from "react";

import { AuthPageHeading } from "../_components/auth-page-heading";
import { SignInForm } from "./_components/sign-in-form";

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
