import { AuthPageHeading } from "../_components/auth-page-heading";
import { SignInForm } from "./_components/sign-in-form";

export default async function SignIn() {
  return (
    <>
      <AuthPageHeading
        title="Sign-in to your account"
        description="Enter your email and password to sign in."
      />

      <SignInForm />
    </>
  );
}
