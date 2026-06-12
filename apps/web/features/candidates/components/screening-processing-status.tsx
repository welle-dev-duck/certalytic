"use client";

import { CheckCircle2, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

const STAGES = [
  "Extracting CV Data",
  "Analyzing Transcript",
  "Gathering Flags",
  "Summing up Metrics",
  "Calculating Hiring Integrity Score (HIS)",
] as const;

type ScreeningProcessingStatusProps = {
  startedAt: string | null;
};

export function ScreeningProcessingStatus({
  startedAt,
}: ScreeningProcessingStatusProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = startedAt ? new Date(startedAt).getTime() : Date.now();

    const tick = () => {
      setElapsed(Math.max(0, Date.now() - start));
    };

    tick();
    const timer = setInterval(tick, 500);

    return () => clearInterval(timer);
  }, [startedAt]);

  const stageDuration = 8_000;
  const currentIndex = Math.min(
    STAGES.length - 1,
    Math.floor(elapsed / stageDuration),
  );

  return (
    <div className="rounded-lg border border-border bg-card p-8">
      <div className="mx-auto max-w-md text-center">
        <div className="relative mx-auto mb-4 flex h-16 w-16 items-center justify-center">
          <span className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
          <span className="absolute inset-2 animate-pulse rounded-full bg-primary/10" />
          <Loader2
            size={28}
            className="relative animate-spin text-primary"
          />
        </div>
        <p className="text-sm font-semibold text-foreground">
          Screening in progress
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Your integrity report will appear here once analysis completes.
        </p>
      </div>

      <div className="mx-auto mt-8 max-w-lg space-y-2">
        {STAGES.map((stage, index) => {
          const isComplete = index < currentIndex;
          const isCurrent = index === currentIndex;

          return (
            <div
              key={stage}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-xs transition-colors",
                isCurrent && "bg-primary/10",
                !isCurrent && !isComplete && "opacity-50",
              )}
            >
              {isComplete ? (
                <CheckCircle2
                  size={14}
                  className="shrink-0 text-[#10B981]"
                />
              ) : isCurrent ? (
                <Loader2
                  size={14}
                  className="shrink-0 animate-spin text-primary"
                />
              ) : (
                <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border border-border" />
              )}
              <span
                className={cn(
                  "font-medium",
                  isCurrent ? "text-primary" : "text-muted-foreground",
                )}
              >
                {stage}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
