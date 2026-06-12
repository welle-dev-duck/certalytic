import { getTokenUsageBarColor } from "@/lib/integrity";

type TokenUsageBarProps = {
  usedPct: number;
  className?: string;
};

export function TokenUsageBar({ usedPct, className = "h-1.5" }: TokenUsageBarProps) {
  const pct = Math.min(100, Math.max(0, usedPct * 100));

  return (
    <div className={`overflow-hidden rounded-full bg-border ${className}`}>
      <div
        className="h-full rounded-full transition-all"
        style={{
          width: `${pct}%`,
          background: getTokenUsageBarColor(usedPct),
        }}
      />
    </div>
  );
}
