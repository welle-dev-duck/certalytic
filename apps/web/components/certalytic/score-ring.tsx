import { getScoreColor } from "@/lib/integrity";

interface ScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
  labelSize?: "sm" | "md" | "lg";
}

export function ScoreRing({
  score,
  size = 80,
  strokeWidth = 6,
  showLabel = true,
  labelSize = "md",
}: ScoreRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(100, score));
  const offset = circumference - (progress / 100) * circumference;
  const color = getScoreColor(score);
  const displayScore = Number(score.toFixed(1));

  const labelSizes = {
    sm:
      size <= 36
        ? "text-[9px] font-bold leading-none"
        : "text-xs font-semibold",
    md: "text-xl font-bold",
    lg: "text-3xl font-bold",
  };

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#263248"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: "stroke-dashoffset 0.6s ease, stroke 0.4s ease",
          }}
        />
      </svg>
      {showLabel && (
        <span
          className={`absolute tabular-nums ${labelSizes[labelSize]}`}
          style={{ color }}
        >
          {displayScore}
        </span>
      )}
    </div>
  );
}
