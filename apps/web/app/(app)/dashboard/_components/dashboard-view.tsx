"use client";

import {
  Activity,
  Plus,
  Search,
  ShieldAlert,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useMemo } from "react";

import { Button } from "@/components/ui/button";
import { CandidatesTable } from "@/features/candidates/components/candidates-table";
import { ScreeningDialogs } from "@/features/candidates/components/screening-dialogs";
import { useCandidateScreeningDialogs } from "@/features/candidates/hooks/use-candidate-screening-dialogs";
import { useDebouncedSearch } from "@/features/candidates/hooks/use-debounced-search";
import { useCandidates } from "@/features/candidates/hooks/use-candidates";
import {
  getIntegrityLevel,
  getNominalStatusStyle,
  getScoreBackground,
  getScoreColor,
} from "@/lib/integrity";

export function DashboardView() {
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
  const nominalStatus = getNominalStatusStyle();

  const { data, isLoading } = useCandidates({
    search: debouncedSearch || undefined,
    limit: 25,
  });

  const candidates = data?.data ?? [];

  const stats = useMemo(() => {
    const scored = candidates.filter((c) => c.status === "complete");
    const flagged = scored.filter(
      (c) =>
        c.integrityScore !== null && getIntegrityLevel(c.integrityScore) === "low",
    );
    const avg =
      scored.length > 0
        ? scored.reduce((sum, c) => sum + (c.integrityScore ?? 0), 0) /
          scored.length
        : null;

    return {
      total: candidates.length,
      scored: scored.length,
      flagged: flagged.length,
      avgIntegrity: avg,
    };
  }, [candidates]);

  const avgScore = stats.avgIntegrity ?? 0;

  const statCards = [
    {
      label: "Total Candidates",
      value: stats.total,
      sub: "Across all roles",
      icon: Users,
      color: "var(--primary)",
      bg: "color-mix(in oklch, var(--primary) 10%, transparent)",
    },
    {
      label: "High Risk Flagged",
      value: stats.flagged,
      sub:
        stats.scored > 0
          ? `${Math.round((stats.flagged / stats.scored) * 100)}% of scored`
          : "No scored candidates",
      icon: ShieldAlert,
      color: getScoreColor(0),
      bg: getScoreBackground(0),
    },
    {
      label: "Avg Integrity Score",
      value: stats.avgIntegrity !== null ? Math.round(stats.avgIntegrity) : "-",
      sub: "Completed screenings",
      icon: Activity,
      color: getScoreColor(avgScore),
      bg: getScoreBackground(avgScore),
    },
    {
      label: "Completed Screenings",
      value: stats.scored,
      sub: `of ${stats.total} total`,
      icon: ShieldCheck,
      color: getScoreColor(100),
      bg: getScoreBackground(100),
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
            Intelligence Overview
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Hiring integrity dashboard
          </p>
        </div>
        <div
          className="flex shrink-0 items-center gap-2 self-start rounded px-3 py-1.5 text-xs font-semibold"
          style={{
            background: nominalStatus.background,
            color: nominalStatus.color,
            border: nominalStatus.border,
          }}
        >
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{
              background: nominalStatus.color,
              boxShadow: nominalStatus.dotShadow,
            }}
          />
          Systems Nominal
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map(({ label, value, sub, icon: Icon, color, bg }) => (
          <div
            key={label}
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
              Recent Candidate Screenings
            </p>
            <Button size="sm" onClick={() => setScreenOpen(true)}>
              <Plus size={13} />
              New Candidate
            </Button>
          </div>
          <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2">
            <Search size={14} className="shrink-0 text-muted-foreground" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by candidate name…"
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
              ? "No candidates match your search."
              : "No screenings yet."
          }
          onRerun={openRerun}
          onDelete={openDelete}
        />
      </div>
    </div>
  );
}
