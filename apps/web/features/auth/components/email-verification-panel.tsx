"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { LoadingSwap } from "@/components/loading-swap";
import { authClient } from "@/lib/auth-client";
import { useTranslations } from "@/lib/i18n/client";

const RESEND_COOLDOWN_SECONDS = 30;

type EmailVerificationPanelProps = {
  email: string;
};

export function EmailVerificationPanel({ email }: EmailVerificationPanelProps) {
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");
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
        callbackURL: process.env.NEXT_PUBLIC_WEB_APP_DASHBOARD_URL,
      });
      if (res.error) {
        toast.error(res.error.message || tCommon("errors.generic"));
        return;
      }
      toast.success(t("verifyEmail.resendSuccess"));
    });
  }

  const resendLabel =
    timeToNextResend > 0
      ? t("verifyEmail.resendCooldown", { seconds: timeToNextResend })
      : t("verifyEmail.resend");

  return (
    <Button
      type="button"
      variant="secondary"
      className="w-full"
      disabled={timeToNextResend > 0 || resendPending}
      onClick={() => resendVerification()}
    >
      <LoadingSwap isLoading={resendPending}>{resendLabel}</LoadingSwap>
    </Button>
  );
}
