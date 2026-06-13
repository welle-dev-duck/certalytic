import { getNominalStatusStyle } from "@/lib/integrity";

export const SYSTEM_STATUS_VALUES = [
  "nominal",
  "maintenance",
  "outage",
] as const;

export type SystemStatus = (typeof SYSTEM_STATUS_VALUES)[number];

const MAINTENANCE_COLOR = "#0EA5E9";
const OUTAGE_COLOR = "#EF4444";

function statusStyle(
  color: string,
  alpha = 0.1,
): {
  background: string;
  color: string;
  border: string;
  dotShadow: string;
} {
  const rgb =
    color === MAINTENANCE_COLOR
      ? "14,165,233"
      : color === OUTAGE_COLOR
        ? "239,68,68"
        : "16,185,129";

  return {
    background: `rgba(${rgb},${alpha})`,
    color,
    border: `1px solid rgba(${rgb},${alpha * 2.5})`,
    dotShadow: `0 0 6px ${color}`,
  };
}

export function parseSystemStatus(
  value: string | undefined,
): SystemStatus {
  const normalized = value?.trim().toLowerCase();

  if (normalized === "maintenance" || normalized === "outage") {
    return normalized;
  }

  return "nominal";
}

export function getConfiguredSystemStatus(): SystemStatus {
  return parseSystemStatus(process.env.NEXT_PUBLIC_SYSTEM_STATUS);
}

export function getSystemStatusStyle(status: SystemStatus): {
  background: string;
  color: string;
  border: string;
  dotShadow: string;
} {
  if (status === "maintenance") {
    return statusStyle(MAINTENANCE_COLOR);
  }

  if (status === "outage") {
    return statusStyle(OUTAGE_COLOR);
  }

  return getNominalStatusStyle();
}
