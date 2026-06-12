import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type RequiredProps = {
  children: ReactNode;
  className?: string;
};

/**
 * Wrap label text so a required indicator (*) appears after the label.
 * Pair with schema validation and/or the `required` attribute on controls.
 */
export function Required({ children, className }: RequiredProps) {
  return (
    <span className={cn("inline-flex items-baseline gap-0.5", className)}>
      <span>{children}</span>
      <span className="font-normal text-destructive" aria-hidden="true">
        *
      </span>
    </span>
  );
}
