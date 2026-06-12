import { AuthPageHeading } from "../_components/auth-page-heading";
import { ForgotPasswordForm } from "./_components/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <>
      <AuthPageHeading
        title="Forgot password"
        description="Enter your email to receive a password reset link"
      />
      <ForgotPasswordForm />
    </>
  );
}
