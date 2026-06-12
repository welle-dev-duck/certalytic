import { VerifyEmail } from "./_components/verify-email";
import { AuthPageHeading } from "../_components/auth-page-heading";

export default function VerifyEmailPage() {
  return (
    <>
      <AuthPageHeading
        title="Verify your email"
        description="We sent you an email with a link to verify your email address."
      />

      <VerifyEmail />
    </>
  );
}
