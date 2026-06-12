"use client";

import { ChevronRight, Plus, Search } from "lucide-react";
import Link from "@/components/ui/link"
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { TablePagination } from "@/components/certalytic/table-pagination";
import { ScoreRing } from "@/components/certalytic/score-ring";
import {
  IntegrityBadge,
  StatusBadge,
} from "@/components/certalytic/status-badge";
import { Button } from "@/components/ui/button";
import { CandidateRowActions } from "@/features/candidates/components/candidate-row-actions";
import { DeleteCandidateDialog } from "@/features/candidates/components/delete-candidate-dialog";
import { RerunCandidateDialog } from "@/features/candidates/components/rerun-candidate-dialog";
import { StartScreeningModal } from "@/features/candidates/components/start-screening-modal";
import { useCandidates } from "@/features/candidates/hooks/use-candidates";
import type { CandidateListItem } from "@/features/candidates/types";
import { useBillingUsage } from "@/features/billing/hooks/use-billing";
import { getIntegrityLevel } from "@/lib/integrity";
import { routes } from "@/lib/routes";

const STATUSES = ["pending", "processing", "complete", "failed"] as const;

function toScore(value: number | null): number | null {
  if (value === null) return null;
  return Math.round(value);
}

function formatDate(value: string | null): string {
  if (!value) return "-";
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("");
}

export function CandidatesList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [screenOpen, setScreenOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [rerunOpen, setRerunOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const firstRender = useRef(true);

  const { data: usage } = useBillingUsage();

  const { data, isLoading } = useCandidates({
    search: debouncedSearch || undefined,
    status: statusFilter ?? undefined,
    limit: pageSize,
    page,
  });

  const candidates = data?.data ?? [];
  const pagination = data?.pagination;

  useEffect(() => {
    if (searchParams.get("screen") === "1") {
      setScreenOpen(true);
      router.replace(routes.candidates());
    }
  }, [router, searchParams]);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }

    const timeout = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, pageSize]);

  const openDelete = (candidate: CandidateListItem) => {
    setSelectedCandidate({ id: candidate.id, name: candidate.name });
    setDeleteOpen(true);
  };

  const openRerun = (candidate: CandidateListItem) => {
    setSelectedCandidate({ id: candidate.id, name: candidate.name });
    setRerunOpen(true);
  };

  return (
    <div className="space-y-5 p-6">
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

      <div>
        <h1 className="text-xl font-bold text-foreground">Candidates</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {candidates.length} screening{candidates.length === 1 ? "" : "s"}{" "}
          loaded
          {usage ? ` · ${usage.available} token(s) available` : ""}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex min-w-52 items-center gap-2 rounded-md border border-border bg-card px-3 py-2">
          <Search size={14} className="text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, role…"
            className="w-48 bg-transparent text-sm text-foreground outline-none"
          />
        </div>

        {(["all", ...STATUSES] as const).map((status) => {
          const active =
            status === "all"
              ? statusFilter === null
              : statusFilter === status;

          return (
            <button
              key={status}
              type="button"
              onClick={() =>
                setStatusFilter(status === "all" ? null : status)
              }
              className="cursor-pointer rounded px-2.5 py-1.5 text-[10px] font-bold tracking-widest transition-all"
              style={{
                background: active
                  ? "color-mix(in oklch, var(--primary) 12%, transparent)"
                  : "var(--c-surface)",
                color: active ? "var(--c-cyan)" : "var(--c-muted)",
                border: `1px solid ${active ? "color-mix(in oklch, var(--primary) 35%, transparent)" : "var(--c-border)"}`,
              }}
            >
              {status.toUpperCase()}
            </button>
          );
        })}
      </div>

      <div className="rounded-lg border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="text-sm font-semibold text-foreground">
            Candidate Screenings
          </p>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => setScreenOpen(true)}>
              <Plus size={13} />
              New Candidate
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="px-4 py-12 text-center text-sm text-muted-foreground">
            Loading candidates…
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="border-b border-border">
                    {[
                      "Candidate",
                      "Role",
                      "Status",
                      "Score",
                      "Integrity",
                      "Rounds",
                      "Screened",
                    ].map((header, index) => (
                      <th
                        key={header}
                        className={`px-4 py-3 text-[10px] font-bold tracking-widest text-muted-foreground ${index === 0 || index === 1 ? "text-left" : "text-right"}`}
                      >
                        {header}
                      </th>
                    ))}
                    <th className="w-10 px-2 py-3" aria-label="Actions" />
                    <th className="w-10 px-2 py-3" aria-label="View" />
                  </tr>
                </thead>
                <tbody>
                  {candidates.length === 0 && (
                    <tr>
                      <td
                        colSpan={9}
                        className="px-4 py-12 text-center text-sm text-muted-foreground"
                      >
                        No candidates match the current filters.
                      </td>
                    </tr>
                  )}
                  {candidates.map((candidate, index) => {
                    const score = toScore(candidate.integrityScore);
                    const isComplete = candidate.status === "complete";

                    return (
                      <tr
                        key={candidate.id}
                        onClick={() =>
                          router.push(
                            routes.candidate(candidate.id),
                          )
                        }
                        className="group cursor-pointer transition-colors hover:bg-muted/50"
                        style={{
                          borderBottom:
                            index < candidates.length - 1
                              ? "1px solid var(--c-border)"
                              : "none",
                        }}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div
                              className="flex h-8 w-8 shrink-0 items-center justify-center rounded text-xs font-bold"
                              style={{
                                background:
                                  "color-mix(in oklch, var(--primary) 10%, transparent)",
                                color: "var(--c-cyan)",
                              }}
                            >
                              {initials(candidate.name)}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-foreground group-hover:underline">
                                {candidate.name}
                              </p>
                              {candidate.email && (
                                <p className="text-[10px] text-muted-foreground">
                                  {candidate.email}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td
                          className="px-4 py-3"
                          onClick={(event) => event.stopPropagation()}
                        >
                          {candidate.roleId && candidate.roleTitle ? (
                            <Link
                              href={routes.role(candidate.roleId,
                              )}
                              className="text-xs text-muted-foreground hover:text-primary hover:underline"
                            >
                              {candidate.roleTitle}
                            </Link>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              {candidate.roleTitle ?? "-"}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end">
                            <StatusBadge status={candidate.status} />
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end">
                            {isComplete && score !== null ? (
                              <ScoreRing
                                score={score}
                                size={36}
                                strokeWidth={3}
                                labelSize="sm"
                              />
                            ) : (
                              <span className="font-mono text-sm text-muted-foreground">
                                -
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end">
                            {isComplete && score !== null ? (
                              <IntegrityBadge
                                level={getIntegrityLevel(score)}
                              />
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                -
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-xs text-muted-foreground">
                          {candidate.roundsCount}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-[11px] text-muted-foreground">
                          {formatDate(candidate.processedAt)}
                        </td>
                        <td className="px-2 py-3 text-right">
                          <CandidateRowActions
                            candidateId={candidate.id}
                            status={candidate.status}
                            onRerun={() => openRerun(candidate)}
                            onDelete={() => openDelete(candidate)}
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
            {pagination ? (
              <TablePagination
                meta={pagination}
                onPageChange={setPage}
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  setPage(1);
                }}
              />
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
