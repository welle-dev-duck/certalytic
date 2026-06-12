"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";

import Link from "@/components/ui/link";
import { Button } from "@/components/ui/button";
import { LoadingSwap } from "@/components/ui/loading-swap";
import { authClient } from "@/lib/auth-client";

const RESEND_COOLDOWN_SECONDS = 30;

type EmailVerificationPanelProps = {
  email: string;
};

export function EmailVerificationPanel({ email }: EmailVerificationPanelProps) {
  const [timeToNextResend, setTimeToNextResend] = useState(
    RESEND_COOLDOWN_SECONDS,
  );
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [resendPending, startResend] = useTransition();

  const clearResendInterval = useCallback(() => {
    if (intervalRef.current != null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const beginCountdown = useCallback(() => {
    clearResendInterval();
    setTimeToNextResend(RESEND_COOLDOWN_SECONDS);
    intervalRef.current = setInterval(() => {
      setTimeToNextResend((time) => {
        if (time <= 1) {
          clearResendInterval();
          return 0;
        }
        return time - 1;
      });
    }, 1000);
  }, [clearResendInterval]);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setTimeToNextResend((time) => {
        if (time <= 1) {
          clearResendInterval();
          return 0;
        }
        return time - 1;
      });
    }, 1000);
    return () => {
      clearResendInterval();
    };
  }, [clearResendInterval]);

  function resendVerification() {
    beginCountdown();
    startResend(async () => {
      const res = await authClient.sendVerificationEmail({
        email,
        callbackURL: process.env.NEXT_PUBLIC_WEB_APP_URL,
      });
      if (res.error) {
        toast.error(res.error.message || "Something went wrong.");
        return;
      }
      toast.success("Verification email sent.");
    });
  }

  return (
    <div className="space-y-4">
      <p className="mt-2 text-sm text-muted-foreground">
        We sent you a verification link. Please check your email and click the
        link to verify your account.
      </p>

      <Button
        variant="default"
        type="button"
        disabled={timeToNextResend > 0 || resendPending}
        onClick={() => resendVerification()}
      >
        <LoadingSwap isLoading={resendPending}>
          {timeToNextResend > 0 ? `Resend in ${timeToNextResend}s` : "Resend"}
        </LoadingSwap>
      </Button>

      <Button variant="secondary" asChild>
        <Link href="/auth/sign-in">Back to sign in</Link>
      </Button>
    </div>
  );
}
