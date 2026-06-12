import { getIntegrityColor, getIntegrityLevel } from "@/lib/integrity";

export function candidateInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function formatCandidateDate(value: string | null): string {
  if (!value) return "-";

  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function toCandidateScore(value: number | null): number | null {
  if (value === null) return null;
  return Math.round(value);
}

export function integrityAvatarColors(score: number, isComplete: boolean) {
  if (!isComplete) {
    return {
      background: "var(--c-surface-2)",
      color: "var(--c-muted)",
    };
  }

  const level = getIntegrityLevel(score);
  const color = getIntegrityColor(level);
  const rgb =
    level === "low"
      ? "239,68,68"
      : level === "medium"
        ? "245,158,11"
        : "16,185,129";

  return {
    background: `rgba(${rgb},0.12)`,
    color,
  };
}
