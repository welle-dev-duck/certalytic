"use client";

import {
  Activity,
  Briefcase,
  Plus,
  Search,
  ShieldAlert,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { CandidatesTable } from "@/features/candidates/components/candidates-table";
import { ScreeningDialogs } from "@/features/candidates/components/screening-dialogs";
import { useCandidateScreeningDialogs } from "@/features/candidates/hooks/use-candidate-screening-dialogs";
import { useDebouncedSearch } from "@/features/candidates/hooks/use-debounced-search";
import { useCandidates } from "@/features/candidates/hooks/use-candidates";
import { useDashboardStats } from "@/features/dashboard/hooks/use-dashboard-stats";
import {
  getScoreBackground,
  getScoreColor,
} from "@/lib/integrity";
import {
  getConfiguredSystemStatus,
  getSystemStatusStyle,
} from "@/lib/system-status";
import { useTranslations } from "@/lib/i18n/client";

const HIGH_RISK_COLOR = "#EF4444";
const HIGH_RISK_BG = "rgba(239,68,68,0.1)";
const MEDIUM_RISK_COLOR = "#F59E0B";
const MEDIUM_RISK_BG = "rgba(245,158,11,0.1)";

export function DashboardView() {
  const t = useTranslations("app");
  const {
    screenOpen,
    setScreenOpen,
    deleteOpen,
    rerunOpen,
    openDelete,
    openRerun,
    handleDeleteOpenChange,
    handleRerunOpenChange,
    selectedCandidate,
  } = useCandidateScreeningDialogs();
  const { search, setSearch, debouncedSearch } = useDebouncedSearch();
  const systemStatus = getConfiguredSystemStatus();
  const systemStatusStyle = getSystemStatusStyle(systemStatus);

  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data, isLoading } = useCandidates({
    search: debouncedSearch || undefined,
    limit: 25,
  });

  const candidates = data?.data ?? [];

  const avgScore = stats?.avgIntegrityScore ?? 0;
  const avgDisplay =
    stats?.avgIntegrityScore !== null && stats?.avgIntegrityScore !== undefined
      ? `${stats.avgIntegrityScore}/100`
      : "-/100";

  const statCards = [
    {
      key: "totalRoles",
      label: t("dashboard.stats.totalRoles"),
      value: statsLoading ? "—" : (stats?.totalRoles ?? 0),
      sub: t("dashboard.stats.activeRoles"),
      icon: Briefcase,
      color: "var(--primary)",
      bg: "color-mix(in oklch, var(--primary) 10%, transparent)",
    },
    {
      key: "totalCandidates",
      label: t("dashboard.stats.totalCandidates"),
      value: statsLoading ? "—" : (stats?.totalCandidates ?? 0),
      sub: t("dashboard.stats.acrossAllRoles"),
      icon: Users,
      color: "var(--primary)",
      bg: "color-mix(in oklch, var(--primary) 10%, transparent)",
    },
    {
      key: "highRiskFlagged",
      label: t("dashboard.stats.highRiskFlagged"),
      value: statsLoading ? "—" : (stats?.highRiskFlagged ?? 0),
      sub: t("dashboard.stats.highRiskSub"),
      icon: ShieldAlert,
      color: HIGH_RISK_COLOR,
      bg: HIGH_RISK_BG,
    },
    {
      key: "mediumRiskFlagged",
      label: t("dashboard.stats.mediumRiskFlagged"),
      value: statsLoading ? "—" : (stats?.mediumRiskFlagged ?? 0),
      sub: t("dashboard.stats.mediumRiskSub"),
      icon: ShieldAlert,
      color: MEDIUM_RISK_COLOR,
      bg: MEDIUM_RISK_BG,
    },
    {
      key: "avgIntegrityScore",
      label: t("dashboard.stats.avgIntegrityScore"),
      value: statsLoading ? "—/100" : avgDisplay,
      sub: t("dashboard.stats.avgIntegritySub"),
      icon: Activity,
      color:
        stats?.avgIntegrityScore !== null &&
        stats?.avgIntegrityScore !== undefined
          ? getScoreColor(avgScore)
          : "var(--muted-foreground)",
      bg:
        stats?.avgIntegrityScore !== null &&
        stats?.avgIntegrityScore !== undefined
          ? getScoreBackground(avgScore)
          : "color-mix(in oklch, var(--muted-foreground) 10%, transparent)",
    },
  ];

  return (
    <div className="space-y-6 p-6">
      <ScreeningDialogs
        screenOpen={screenOpen}
        onScreenOpenChange={setScreenOpen}
        deleteOpen={deleteOpen}
        onDeleteOpenChange={handleDeleteOpenChange}
        rerunOpen={rerunOpen}
        onRerunOpenChange={handleRerunOpenChange}
        selectedCandidate={selectedCandidate}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">
            {t("dashboard.title")}
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {t("dashboard.subtitle")}
          </p>
        </div>
        <div
          className="flex shrink-0 items-center gap-2 self-start rounded px-3 py-1.5 text-xs font-semibold"
          style={{
            background: systemStatusStyle.background,
            color: systemStatusStyle.color,
            border: systemStatusStyle.border,
          }}
        >
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{
              background: systemStatusStyle.color,
              boxShadow: systemStatusStyle.dotShadow,
            }}
          />
          {t(`dashboard.systemStatus.${systemStatus}`)}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {statCards.map(({ key, label, value, sub, icon: Icon, color, bg }) => (
          <div
            key={key}
            className="rounded-lg border border-border bg-card p-4"
          >
            <div className="mb-3 flex items-start justify-between">
              <p className="text-xs font-medium tracking-wide text-muted-foreground">
                {label}
              </p>
              <div
                className="flex h-7 w-7 items-center justify-center rounded"
                style={{ background: bg }}
              >
                <Icon size={14} style={{ color }} />
              </div>
            </div>
            <p
              className="text-3xl leading-none font-bold tabular-nums"
              style={{ color }}
            >
              {value}
            </p>
            <p className="mt-1.5 text-xs text-muted-foreground">{sub}</p>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-border bg-card">
        <div className="space-y-3 border-b border-border px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-foreground">
              {t("dashboard.recentScreenings")}
            </p>
            <Button size="sm" onClick={() => setScreenOpen(true)}>
              <Plus size={13} />
              {t("dashboard.newCandidate")}
            </Button>
          </div>
          <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2">
            <Search size={14} className="shrink-0 text-muted-foreground" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t("dashboard.searchPlaceholder")}
              className="w-full bg-transparent text-sm text-foreground outline-none"
            />
          </div>
        </div>

        <CandidatesTable
          candidates={candidates}
          variant="compact"
          isLoading={isLoading}
          emptyMessage={
            search.trim() !== ""
              ? t("dashboard.emptySearch")
              : t("dashboard.emptyDefault")
          }
          onRerun={openRerun}
          onDelete={openDelete}
        />
      </div>
    </div>
  );
}
