import { AuthPageHeading, SignUpForm } from "@/features/auth/components";

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
