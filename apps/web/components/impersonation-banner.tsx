"use client";

import { UserCog } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { isDashImpersonation } from "@/lib/auth/impersonation";
import { useTranslations } from "@/lib/i18n/client";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

const IMPERSONATION_BANNER_HEIGHT = "2.75rem";

export function ImpersonationBanner() {
  const t = useTranslations("common");
  const { data: session } = authClient.useSession();
  const [ending, setEnding] = useState(false);

  const isImpersonating = Boolean(session?.session?.impersonatedBy);

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--impersonation-banner-height",
      isImpersonating ? IMPERSONATION_BANNER_HEIGHT : "0px",
    );

    return () => {
      document.documentElement.style.setProperty(
        "--impersonation-banner-height",
        "0px",
      );
    };
  }, [isImpersonating]);

  if (!isImpersonating || !session?.user) return null;

  async function handleStopImpersonating() {
    setEnding(true);

    const impersonatedBy = session?.session?.impersonatedBy;

    if (impersonatedBy && isDashImpersonation(impersonatedBy)) {
      const result = await authClient.signOut();

      if (result.error) {
        toast.error(result.error.message ?? t("errors.generic"));
        setEnding(false);
        return;
      }

      window.location.href = routes.home();
      return;
    }

    const result = await authClient.admin.stopImpersonating();

    if (result.error) {
      toast.error(result.error.message ?? t("errors.generic"));
      setEnding(false);
      return;
    }

    window.location.reload();
  }

  return (
    <div
      role="status"
      className={cn(
        "fixed inset-x-0 z-[60] flex min-h-11 items-center justify-center gap-3 px-4 py-2.5",
        "top-[var(--banner-height,0px)]",
        "border-b border-amber-500/30 bg-amber-500/15 text-sm text-amber-950",
        "dark:border-amber-400/25 dark:bg-amber-500/20 dark:text-amber-50",
      )}
    >
      <UserCog
        className="size-4 shrink-0 text-amber-700 dark:text-amber-200"
        aria-hidden
      />
      <p className="text-center font-medium">
        {t("impersonation.message", { email: session.user.email })}
      </p>
      <Button
        type="button"
        size="sm"
        variant="secondary"
        className="h-8 shrink-0 bg-amber-900 text-amber-50 hover:bg-amber-800 dark:bg-amber-100 dark:text-amber-950 dark:hover:bg-amber-200"
        disabled={ending}
        onClick={() => void handleStopImpersonating()}
      >
        {t("impersonation.end")}
      </Button>
    </div>
  );
}
