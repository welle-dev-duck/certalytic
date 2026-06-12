"use client";

import { CheckCircle2 } from "lucide-react";

import { SCREENING_STEPS } from "@/features/candidates/components/start-screening/types";
import { cn } from "@/lib/utils";

type StepIndicatorProps = {
  step: number;
  lockRole?: boolean;
};

export function StepIndicator({ step, lockRole = false }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-between gap-2 px-1">
      {SCREENING_STEPS.map((item, itemIndex) => {
        const isComplete = lockRole
          ? item.id === 1 || step > item.id
          : step > item.id;
        const isActive = step === item.id;

        return (
          <div key={item.id} className="flex flex-1 items-center gap-3">
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : isComplete
                      ? "bg-primary/80 text-primary-foreground"
                      : "bg-muted text-muted-foreground",
                )}
              >
                {isComplete ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  item.id
                )}
              </span>
              <div className="hidden sm:block">
                <p
                  className={cn(
                    "text-sm font-medium",
                    isActive ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {item.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  {item.description}
                </p>
              </div>
            </div>
            {itemIndex < SCREENING_STEPS.length - 1 ? (
              <div
                className={cn(
                  "h-px flex-1",
                  isComplete ? "bg-primary/60" : "bg-border",
                )}
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
