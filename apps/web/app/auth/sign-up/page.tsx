import { AuthPageHeading } from "../_components/auth-page-heading";
import { SignUpForm } from "./_components/sign-up-form";

export default async function SignUp() {
  return (
    <>
      <AuthPageHeading
        title="Create an account"
        description="Enter your details below to create your account"
      />

      <SignUpForm />
    </>
  );
}
