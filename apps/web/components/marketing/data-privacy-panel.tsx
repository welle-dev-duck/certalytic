"use client";

import { ShieldCheck } from "lucide-react";

import { useTranslations } from "@/lib/i18n/client";
import { getIntegrityColor } from "@/lib/integrity";
import { cn } from "@/lib/utils";

const successColor = getIntegrityColor("high");

type DataPrivacyPanelProps = {
  className?: string;
  prominent?: boolean;
};

export function DataPrivacyPanel({
  className,
  prominent = false,
}: DataPrivacyPanelProps) {
  const t = useTranslations("marketing");

  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card p-5",
        prominent && "p-6 md:p-8",
        className,
      )}
    >
      <p
        className={cn(
          "mb-4 font-bold tracking-widest text-muted-foreground",
          prominent ? "text-xs md:text-sm" : "text-[10px]",
        )}
      >
        {t("dataPrivacy.label")}
      </p>
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <ShieldCheck
            size={prominent ? 20 : 16}
            className="mt-0.5 shrink-0"
            style={{ color: successColor }}
          />
          <div>
            <p
              className={cn(
                "font-semibold text-foreground",
                prominent ? "text-sm md:text-base" : "text-xs",
              )}
            >
              {t("dataPrivacy.sovereignTitle")}
            </p>
            <p
              className={cn(
                "mt-0.5 leading-relaxed text-muted-foreground",
                prominent ? "text-sm md:text-base" : "text-xs",
              )}
            >
              {t("dataPrivacy.sovereignDescription")}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-border py-2.5">
          <div>
            <p
              className={cn(
                "font-semibold text-foreground",
                prominent ? "text-sm" : "text-xs",
              )}
            >
              {t("dataPrivacy.modelTraining")}
            </p>
            <p
              className={cn(
                "mt-0.5 text-muted-foreground",
                prominent ? "text-xs md:text-sm" : "text-[10px]",
              )}
            >
              {t("dataPrivacy.modelTrainingDescription")}
            </p>
          </div>
          <span
            className={cn("font-bold", prominent ? "text-sm" : "text-xs")}
            style={{ color: successColor }}
          >
            {t("dataPrivacy.guaranteed")}
          </span>
        </div>
      </div>
    </div>
  );
}
