import { cn } from "@/lib/utils";
import { Loader2Icon } from "lucide-react";
import type { ReactNode } from "react";

export function LoadingSwap({
  isLoading,
  children,
  className,
}: {
  isLoading: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className="relative flex items-center justify-center w-full">
      {/* Content */}
      <div
        className={cn(
          "flex items-center justify-center gap-2 w-full",
          isLoading ? "invisible" : "visible",
          className,
        )}
      >
        {children}
      </div>

      {/* Loader */}
      <div
        className={cn(
          "absolute inset-0 flex items-center justify-center",
          isLoading ? "visible" : "invisible",
          className,
        )}
      >
        <Loader2Icon className="animate-spin" />
      </div>
    </div>
  );
}
