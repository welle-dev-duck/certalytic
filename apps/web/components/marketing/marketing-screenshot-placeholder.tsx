"use client";

import { ImageIcon } from "lucide-react";
import { useState } from "react";

export function MarketingScreenshotPlaceholder({
  filename,
  label,
}: {
  filename: string;
  label: string;
}) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const src = `/marketing/${filename}`;

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      {!failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={label}
          className={loaded ? "block w-full" : "hidden"}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
        />
      ) : null}
      {!loaded || failed ? (
        <div className="flex aspect-[16/10] flex-col items-center justify-center gap-3 border border-dashed border-muted-foreground/25 bg-muted/20 p-6 text-center">
          <ImageIcon
            size={28}
            className="text-muted-foreground/60"
            strokeWidth={1.5}
          />
          <div>
            <p className="text-sm font-medium text-foreground">{label}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Drop screenshot at{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-[10px]">
                public/marketing/{filename}
              </code>
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
