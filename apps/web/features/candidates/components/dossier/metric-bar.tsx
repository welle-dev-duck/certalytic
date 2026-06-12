import { getMetricBarColor } from "@/lib/integrity";

export function MetricBar({
  label,
  value,
  invert = false,
  explanation,
}: {
  label: string;
  value: number | null;
  invert?: boolean;
  explanation?: string;
}) {
  if (value === null) {
    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{label}</span>
          <span className="text-xs font-semibold text-muted-foreground">N/A</span>
        </div>
        {explanation && (
          <p className="text-xs leading-relaxed text-muted-foreground">
            {explanation}
          </p>
        )}
      </div>
    );
  }

  const pct = Math.min(100, Math.max(0, value));
  const color = getMetricBarColor(pct, invert);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="font-mono text-xs font-bold" style={{ color }}>
          {Math.round(value)}%
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-border">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      {explanation && (
        <p className="text-xs leading-relaxed text-muted-foreground">
          {explanation}
        </p>
      )}
    </div>
  );
}
