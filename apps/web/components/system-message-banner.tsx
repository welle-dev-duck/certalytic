import { Info } from "lucide-react";

import { cn } from "@/lib/utils";

type SystemMessageBannerProps = {
  text: string;
};

export function SystemMessageBanner({ text }: SystemMessageBannerProps) {
  return (
    <div
      role="status"
      className={cn(
        "fixed inset-x-0 top-0 z-50 flex min-h-11 items-center justify-center gap-2",
        "border-b border-sky-500/20 bg-sky-500/10 px-4 py-2.5 text-sm text-sky-950",
        "dark:border-sky-400/20 dark:bg-sky-500/15 dark:text-sky-50",
      )}
    >
      <Info
        className="size-4 shrink-0 text-sky-600 dark:text-sky-300"
        aria-hidden
      />
      <p className="text-center font-medium">{text}</p>
    </div>
  );
}
