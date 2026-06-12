"use client";

import {
  Activity,
  ChevronRight,
  Plus,
  Search,
  ShieldAlert,
  ShieldCheck,
  Users,
} from "lucide-react";
import Link from "@/components/ui/link"
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { ScoreRing } from "@/components/certalytic/score-ring";
import { StatusBadge } from "@/components/certalytic/status-badge";
import { Button } from "@/components/ui/button";
import { CandidateRowActions } from "@/features/candidates/components/candidate-row-actions";
import { DeleteCandidateDialog } from "@/features/candidates/components/delete-candidate-dialog";
import { RerunCandidateDialog } from "@/features/candidates/components/rerun-candidate-dialog";
import { StartScreeningModal } from "@/features/candidates/components/start-screening-modal";
import { useCandidates } from "@/features/candidates/hooks/use-candidates";
import type { CandidateListItem } from "@/features/candidates/types";
import { getIntegrityLevel, getScoreColor } from "@/lib/integrity";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

function initials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function levelColor(score: number): { text: string; bg: string } {
  const level = getIntegrityLevel(score);
  const text =
    level === "low" ? "#EF4444" : level === "medium" ? "#F59E0B" : "#10B981";
  const rgb =
    level === "low"
      ? "239,68,68"
      : level === "medium"
        ? "245,158,11"
        : "16,185,129";

  return { text, bg: `rgba(${rgb},0.12)` };
}

function toScore(value: number | null): number {
  if (value === null) return 0;
  return value;
}

export function DashboardView() {
  const router = useRouter();
  const [screenOpen, setScreenOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [rerunOpen, setRerunOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const firstRender = useRef(true);

  const { data, isLoading } = useCandidates({
    search: debouncedSearch || undefined,
    limit: 25,
  });

  const candidates = useMemo(
    () => data?.pages.flatMap((page) => page.data) ?? [],
    [data],
  );

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const timeout = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(timeout);
  }, [search]);

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
      color: "#EF4444",
      bg: "rgba(239,68,68,0.1)",
    },
    {
      label: "Avg Integrity Score",
      value: stats.avgIntegrity !== null ? Math.round(stats.avgIntegrity) : "-",
      sub: "Completed screenings",
      icon: Activity,
      color: getScoreColor(avgScore),
      bg: `rgba(${avgScore >= 75 ? "16,185,129" : avgScore >= 50 ? "245,158,11" : "239,68,68"},0.1)`,
    },
    {
      label: "Completed Screenings",
      value: stats.scored,
      sub: `of ${stats.total} total`,
      icon: ShieldCheck,
      color: "#10B981",
      bg: "rgba(16,185,129,0.1)",
    },
  ];

  const openDelete = (candidate: CandidateListItem) => {
    setSelectedCandidate({ id: candidate.id, name: candidate.name });
    setDeleteOpen(true);
  };

  const openRerun = (candidate: CandidateListItem) => {
    setSelectedCandidate({ id: candidate.id, name: candidate.name });
    setRerunOpen(true);
  };

  return (
    <div className="space-y-6 p-6">
      <DeleteCandidateDialog
        open={deleteOpen}
        onOpenChange={(open) => {
          setDeleteOpen(open);
          if (!open) setSelectedCandidate(null);
        }}
        candidate={selectedCandidate}
      />
      <RerunCandidateDialog
        open={rerunOpen}
        onOpenChange={(open) => {
          setRerunOpen(open);
          if (!open) setSelectedCandidate(null);
        }}
        candidate={selectedCandidate}
      />
      <StartScreeningModal open={screenOpen} onOpenChange={setScreenOpen} />

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
            background: "rgba(16,185,129,0.1)",
            color: "#10B981",
            border: "1px solid rgba(16,185,129,0.25)",
          }}
        >
          <span
            className="h-1.5 w-1.5 rounded-full bg-[#10B981]"
            style={{ boxShadow: "0 0 6px #10B981" }}
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

        {isLoading ? (
          <div className="px-4 py-12 text-center text-sm text-muted-foreground">
            Loading…
          </div>
        ) : candidates.length === 0 ? (
          <div className="px-4 py-12 text-center text-sm text-muted-foreground">
            {search.trim() !== ""
              ? "No candidates match your search."
              : "No screenings yet."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead>
                <tr className="border-b border-border">
                  {[
                    "Candidate",
                    "Role",
                    "Status",
                    "Score",
                    "Created At",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-2.5 text-left text-[10px] font-bold tracking-widest text-muted-foreground"
                    >
                      {h}
                    </th>
                  ))}
                  <th className="w-10 px-2 py-2.5" aria-label="Actions" />
                  <th className="w-10 px-2 py-2.5" aria-label="View" />
                </tr>
              </thead>
              <tbody>
                {candidates.map((c, i) => {
                  const score = toScore(c.integrityScore);
                  const isComplete = c.status === "complete";
                  const colors = levelColor(score);
                  const isLast = i === candidates.length - 1;

                  return (
                    <tr
                      key={c.id}
                      onClick={() =>
                        router.push(routes.candidate(c.id))
                      }
                      className={cn(
                        "group cursor-pointer transition-colors hover:bg-muted/50",
                        !isLast && "border-b border-border",
                      )}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-xs font-bold"
                            style={{
                              background: isComplete
                                ? colors.bg
                                : "var(--c-surface-2)",
                              color: isComplete
                                ? colors.text
                                : "var(--c-muted)",
                            }}
                          >
                            {initials(c.name)}
                          </div>
                          <span className="text-sm font-semibold text-foreground group-hover:underline">
                            {c.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {c.roleTitle ?? "-"}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={c.status} />
                      </td>
                      <td className="px-4 py-3">
                        {isComplete && c.integrityScore !== null ? (
                          <ScoreRing
                            score={score}
                            size={32}
                            strokeWidth={3}
                            labelSize="sm"
                          />
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            -
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        {c.createdAt
                          ? new Date(c.createdAt).toLocaleDateString()
                          : "-"}
                      </td>
                      <td className="px-2 py-3 text-right">
                        <CandidateRowActions
                          candidateId={c.id}
                          status={c.status}
                          onRerun={() => openRerun(c)}
                          onDelete={() => openDelete(c)}
                        />
                      </td>
                      <td className="px-2 py-3 text-right">
                        <ChevronRight
                          size={16}
                          className="text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
