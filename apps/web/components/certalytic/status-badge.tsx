"use client";

import { useTranslations } from "@/lib/i18n/client";
import type { Flag, IntegrityLevel } from "@/lib/integrity";

interface IntegrityBadgeProps {
  level: IntegrityLevel;
  className?: string;
}

export function IntegrityBadge({ level, className = "" }: IntegrityBadgeProps) {
  const t = useTranslations("common");

  const config = {
    high: {
      label: t("badges.integrity.high"),
      bg: "rgba(16,185,129,0.12)",
      text: "#10B981",
      border: "rgba(16,185,129,0.3)",
    },
    medium: {
      label: t("badges.integrity.medium"),
      bg: "rgba(245,158,11,0.12)",
      text: "#F59E0B",
      border: "rgba(245,158,11,0.3)",
    },
    low: {
      label: t("badges.integrity.low"),
      bg: "rgba(239,68,68,0.12)",
      text: "#EF4444",
      border: "rgba(239,68,68,0.3)",
    },
  }[level];

  return (
    <span
      className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold tracking-widest ${className}`}
      style={{
        background: config.bg,
        color: config.text,
        border: `1px solid ${config.border}`,
      }}
    >
      <span
        className="inline-block h-1.5 w-1.5 rounded-full"
        style={{
          background: config.text,
          boxShadow: `0 0 5px ${config.text}`,
        }}
      />
      {config.label}
    </span>
  );
}

interface FlagBadgeProps {
  flag: Flag;
}

export function FlagBadge({ flag }: FlagBadgeProps) {
  const t = useTranslations("common");

  const label =
    t(`badges.flags.${flag.type}`) === `badges.flags.${flag.type}`
      ? t("badges.flags.signal")
      : t(`badges.flags.${flag.type}`);

  const colors: Record<
    Flag["severity"],
    { bg: string; text: string; border: string }
  > = {
    critical: {
      bg: "rgba(239,68,68,0.12)",
      text: "#EF4444",
      border: "rgba(239,68,68,0.3)",
    },
    warning: {
      bg: "rgba(245,158,11,0.12)",
      text: "#F59E0B",
      border: "rgba(245,158,11,0.3)",
    },
    info: {
      bg: "rgba(139,92,246,0.12)",
      text: "#8B5CF6",
      border: "rgba(139,92,246,0.3)",
    },
  };
  const c = colors[flag.severity];

  return (
    <span
      className="inline-flex items-center rounded px-2 py-0.5 text-[10px] font-bold tracking-wider"
      style={{
        background: c.bg,
        color: c.text,
        border: `1px solid ${c.border}`,
      }}
    >
      {label}
    </span>
  );
}

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const t = useTranslations("common");

  const statusStyles: Record<
    string,
    { bg: string; text: string; border: string }
  > = {
    complete: {
      bg: "rgba(16,185,129,0.12)",
      text: "#10B981",
      border: "rgba(16,185,129,0.3)",
    },
    processing: {
      bg: "rgba(6,182,212,0.12)",
      text: "#06B6D4",
      border: "rgba(6,182,212,0.3)",
    },
    pending: {
      bg: "rgba(148,163,184,0.12)",
      text: "#94A3B8",
      border: "rgba(148,163,184,0.3)",
    },
    failed: {
      bg: "rgba(239,68,68,0.12)",
      text: "#EF4444",
      border: "rgba(239,68,68,0.3)",
    },
  };

  const c = statusStyles[status] ?? statusStyles.pending!;
  const label =
    t(`badges.status.${status}`) === `badges.status.${status}`
      ? t("badges.status.pending")
      : t(`badges.status.${status}`);
  const isOngoing = status === "pending" || status === "processing";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold tracking-wider ${isOngoing ? "animate-pulse" : ""}`}
      style={{
        background: c.bg,
        color: c.text,
        border: `1px solid ${c.border}`,
      }}
    >
      {isOngoing && (
        <span
          className="inline-block h-1.5 w-1.5 animate-pulse rounded-full"
          style={{
            background: c.text,
            boxShadow: `0 0 6px ${c.text}`,
          }}
        />
      )}
      {label}
    </span>
  );
}
