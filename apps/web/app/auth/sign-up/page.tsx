import { AuthPageHeading } from "../_components/auth-page-heading";
import { SignUpForm } from "./_components/sign-up-form";

export default async function SignUp() {
  return (
    <>
      <AuthPageHeading
        title="Sign-up and start screening"
        description="Create an account to get started."
      />

      <SignUpForm />
    </>
  );
}
