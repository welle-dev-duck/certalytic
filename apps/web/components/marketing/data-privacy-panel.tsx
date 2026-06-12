import { ShieldCheck } from "lucide-react";

import { cn } from "@/lib/utils";

type DataPrivacyPanelProps = {
  className?: string;
  prominent?: boolean;
};

export function DataPrivacyPanel({
  className,
  prominent = false,
}: DataPrivacyPanelProps) {
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
        DATA & PRIVACY
      </p>
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <ShieldCheck
            size={prominent ? 20 : 16}
            className="mt-0.5 shrink-0 text-[#10B981]"
          />
          <div>
            <p
              className={cn(
                "font-semibold text-foreground",
                prominent ? "text-sm md:text-base" : "text-xs",
              )}
            >
              EU Sovereign Processing
            </p>
            <p
              className={cn(
                "mt-0.5 leading-relaxed text-muted-foreground",
                prominent ? "text-sm md:text-base" : "text-xs",
              )}
            >
              All candidate data is processed exclusively within EU jurisdiction
              — Hetzner EU datacenters (Germany/Finland) and Mistral AI La
              Plateforme (Paris, France). No US cloud compute or CDN in the
              data path.
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
              Model Training
            </p>
            <p
              className={cn(
                "mt-0.5 text-muted-foreground",
                prominent ? "text-xs md:text-sm" : "text-[10px]",
              )}
            >
              Candidate data is never used to train, fine-tune, or improve
              Mistral foundation models.
            </p>
          </div>
          <span
            className={cn(
              "font-bold text-[#10B981]",
              prominent ? "text-sm" : "text-xs",
            )}
          >
            Guaranteed
          </span>
        </div>
      </div>
    </div>
  );
}
