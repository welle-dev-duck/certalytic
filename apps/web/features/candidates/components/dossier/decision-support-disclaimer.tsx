"use client";

import { MessageCircleWarning } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { useTranslations } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";

export function DecisionSupportDisclaimer({
  message,
  className,
  variant = "prominent",
}: {
  message?: string;
  className?: string;
  variant?: "prominent" | "subtle";
}) {
  const t = useTranslations("app");
  const resolvedMessage = message ?? t("dossier.disclaimer.message");

  return (
    <Alert
      variant="default"
      className={cn(
        "border-amber-500/45 bg-amber-500/10 text-amber-950 dark:text-amber-50",
        variant === "subtle" && "mt-0 bg-amber-500/8",
        className,
      )}
    >
      <MessageCircleWarning
        size={13}
        className="shrink-0 text-amber-700 dark:text-amber-300"
      />
      <AlertDescription className="text-amber-950 dark:text-amber-50/95">
        {resolvedMessage}
      </AlertDescription>
    </Alert>
  );
}
