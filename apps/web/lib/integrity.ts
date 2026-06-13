import type { Translator } from "@/lib/i18n/translate";

export type IntegrityLevel = "high" | "medium" | "low";

export type FlagType =
  | "ai_text"
  | "synthetic_profile"
  | "interview_prompt"
  | "credential_gap"
  | "platform_mismatch"
  | "insufficient_signal"
  | "response_latency";

export type FlagSeverity = "critical" | "warning" | "info";

export interface Flag {
  type: FlagType;
  severity: FlagSeverity;
  description: string;
  confidence: number;
}

export function getIntegrityLevel(score: number): IntegrityLevel {
  if (score >= 75) return "high";
  if (score >= 50) return "medium";
  return "low";
}

export function getIntegrityColor(level: IntegrityLevel): string {
  if (level === "high") return "#10B981";
  if (level === "medium") return "#F59E0B";
  return "#EF4444";
}

export function getScoreColor(score: number): string {
  if (score >= 75) return "#10B981";
  if (score >= 50) return "#F59E0B";
  return "#EF4444";
}

export function getScoreBackground(score: number, alpha = 0.1): string {
  if (score >= 75) return `rgba(16,185,129,${alpha})`;
  if (score >= 50) return `rgba(245,158,11,${alpha})`;
  return `rgba(239,68,68,${alpha})`;
}

export function getIntegrityLevelStyle(level: IntegrityLevel): {
  text: string;
  background: string;
} {
  const text = getIntegrityColor(level);
  const rgb =
    level === "low"
      ? "239,68,68"
      : level === "medium"
        ? "245,158,11"
        : "16,185,129";

  return { text, background: `rgba(${rgb},0.12)` };
}

export function getMetricBarColor(value: number, invert = false): string {
  const isGood = invert ? value < 30 : value > 70;
  const isMedium = invert ? value < 60 : value > 40;
  return isGood
    ? getScoreColor(80)
    : isMedium
      ? getScoreColor(60)
      : getScoreColor(0);
}

export function getRiskVectorColor(value: number): string {
  if (value > 60) return getScoreColor(0);
  if (value > 30) return getScoreColor(60);
  return getScoreColor(80);
}

export function getAuthenticityStyle(authentic: boolean): {
  background: string;
  color: string;
} {
  if (authentic) {
    return {
      background: getScoreBackground(80),
      color: getScoreColor(80),
    };
  }

  return {
    background: getScoreBackground(0),
    color: getScoreColor(0),
  };
}

export function getTokenUsageBarColor(usedRatio: number): string {
  if (usedRatio > 0.85) return "#EF4444";
  if (usedRatio > 0.65) return "#F59E0B";
  return "var(--primary)";
}

export function getNominalStatusStyle(): {
  background: string;
  color: string;
  border: string;
  dotShadow: string;
} {
  const color = getScoreColor(100);
  return {
    background: getScoreBackground(100),
    color,
    border: `1px solid ${getScoreBackground(100, 0.25)}`,
    dotShadow: `0 0 6px ${color}`,
  };
}

export const INTEGRITY_DISTRIBUTION_META = [
  { key: "high" as const, color: "#10B981" },
  { key: "medium" as const, color: "#F59E0B" },
  { key: "low" as const, color: "#EF4444" },
] as const;

export function getIntegrityDistributionLabels(t: Translator) {
  return INTEGRITY_DISTRIBUTION_META.map((item) => ({
    ...item,
    label: t(`integrity.distribution.${item.key}`),
  }));
}
