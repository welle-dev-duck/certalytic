import { AuthPageHeading, ForgotPasswordForm } from "@/features/auth/components";

export default function ForgotPassword() {
  return (
    <>
      <AuthPageHeading
        title="Forgot your password?"
        description="Enter your email and we'll send you a reset link."
      />
      <ForgotPasswordForm />
    </>
  );
}
