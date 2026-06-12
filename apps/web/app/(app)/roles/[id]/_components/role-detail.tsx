"use client";

import {
  ArrowLeft,
  ChevronRight,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import Link from "@/components/ui/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { ScoreRing } from "@/components/certalytic/score-ring";
import { TablePagination } from "@/components/certalytic/table-pagination";
import { StatusBadge } from "@/components/certalytic/status-badge";
import { Button } from "@/components/ui/button";
import { CandidateRowActions } from "@/features/candidates/components/candidate-row-actions";
import { DeleteCandidateDialog } from "@/features/candidates/components/delete-candidate-dialog";
import { RerunCandidateDialog } from "@/features/candidates/components/rerun-candidate-dialog";
import { StartScreeningModal } from "@/features/candidates/components/start-screening-modal";
import { useCandidates } from "@/features/candidates/hooks/use-candidates";
import type { CandidateListItem } from "@/features/candidates/types";
import { RoleExportAction } from "@/features/roles/components/role-export-action";
import { RoleFormDialog } from "@/features/roles/components/role-form-dialog";
import {
  useDeleteRole,
  useRole,
} from "@/features/roles/hooks/use-roles";
import { useCursorPagination, cursorPageRange } from "@/hooks/use-cursor-pagination";
import { getScoreColor } from "@/lib/integrity";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

const DIST_META: {
  key: "high" | "medium" | "low";
  label: string;
  color: string;
}[] = [
  { key: "high", label: "High (75+)", color: "#10B981" },
  { key: "medium", label: "Medium (50–74)", color: "#F59E0B" },
  { key: "low", label: "Low (<50)", color: "#EF4444" },
];

function formatDate(value: string | null): string {
  if (!value) return "-";

  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function toScore(value: number | null): number | null {
  if (value === null) return null;
  return Math.round(value);
}

function CollapsibleJobDescription({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const [isTruncated, setIsTruncated] = useState(false);
  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || expanded) return;

    const checkTruncation = () => {
      setIsTruncated(el.scrollHeight > el.clientHeight + 1);
    };

    checkTruncation();
    const observer = new ResizeObserver(checkTruncation);
    observer.observe(el);

    return () => observer.disconnect();
  }, [text, expanded]);

  const showToggle = expanded || isTruncated;

  return (
    <div>
      <p
        ref={ref}
        className={cn(
          "text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground",
          !expanded && "max-h-40 overflow-hidden",
        )}
      >
        {text}
      </p>
      {showToggle ? (
        <button
          type="button"
          onClick={() => setExpanded((open) => !open)}
          className="mt-2 text-xs font-medium text-primary hover:underline"
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      ) : null}
    </div>
  );
}

export function RoleDetail({ roleId }: { roleId: string }) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [screenOpen, setScreenOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [rerunOpen, setRerunOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCandidate, setSelectedCandidate] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [pageSize, setPageSize] = useState(25);
  const { cursor, hasPrevPage, pageIndex, goNext, goPrev, reset } =
    useCursorPagination();

  const { data: role, isLoading } = useRole(roleId);
  const deleteRole = useDeleteRole();

  const { data: candidatesData, isLoading: candidatesLoading } = useCandidates({
    role_id: roleId,
    limit: pageSize,
    cursor,
    search: debouncedSearch || undefined,
  });

  const candidates = candidatesData?.data ?? [];
  const candidatesPagination = candidatesData?.pagination;
  const { from, to } = cursorPageRange(
    pageIndex,
    pageSize,
    candidates.length,
  );

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search.trim());
      reset();
    }, 350);
    return () => clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    reset();
  }, [pageSize, reset]);

  if (isLoading || !role) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center p-6 text-sm text-muted-foreground">
        Loading role…
      </div>
    );
  }

  const stats = role.stats;

  function openDelete(candidate: CandidateListItem) {
    setSelectedCandidate({ id: candidate.id, name: candidate.name });
    setDeleteOpen(true);
  }

  function openRerun(candidate: CandidateListItem) {
    setSelectedCandidate({ id: candidate.id, name: candidate.name });
    setRerunOpen(true);
  }

  function handleDeleteRole() {
    if (
      !confirm(
        `Delete "${role.title}"? Candidates keep their snapshot title and description.`,
      )
    ) {
      return;
    }

    void deleteRole.mutateAsync(roleId).then(() => {
      router.push(routes.roles());
    });
  }

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
      <RoleFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        mode="edit"
        role={role}
      />
      <StartScreeningModal
        open={screenOpen}
        onOpenChange={setScreenOpen}
        preselectedRoleId={roleId}
        lockRole
      />

      <div className="flex items-center justify-between gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href={routes.roles()}>
            <ArrowLeft size={13} />
            Back to Roles
          </Link>
        </Button>

        <div className="flex items-center gap-2">
          <RoleExportAction roleId={roleId} />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setEditOpen(true)}
          >
            <Pencil size={14} />
            Edit
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={handleDeleteRole}
            disabled={deleteRole.isPending}
          >
            <Trash2 size={14} />
            Delete
          </Button>
        </div>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-foreground">{role.title}</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Created {formatDate(role.createdAt)} · {role.candidatesCount}{" "}
          screening{role.candidatesCount === 1 ? "" : "s"}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[300px_1fr]">
        <div className="space-y-5">
          <div className="rounded-lg border border-border bg-card p-5">
            <p className="mb-4 text-[10px] font-bold tracking-widest text-muted-foreground">
              AVG INTEGRITY
            </p>
            <div className="flex flex-col items-center">
              {stats.avgIntegrity !== null ? (
                <ScoreRing
                  score={stats.avgIntegrity}
                  size={132}
                  strokeWidth={10}
                  labelSize="lg"
                />
              ) : (
                <div className="flex h-[132px] w-[132px] items-center justify-center rounded-full border-2 border-dashed border-border text-sm text-muted-foreground">
                  No scores
                </div>
              )}
              <p className="mt-3 text-xs text-muted-foreground">
                across {stats.scored} scored candidate
                {stats.scored === 1 ? "" : "s"}
              </p>
            </div>

            <div className="mt-5 space-y-2.5">
              {DIST_META.map((item) => {
                const value = stats.distribution[item.key];
                const pct =
                  stats.scored > 0 ? (value / stats.scored) * 100 : 0;

                return (
                  <div key={item.key}>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-[11px] text-muted-foreground">
                        {item.label}
                      </span>
                      <span
                        className="font-mono text-[11px] font-bold"
                        style={{ color: item.color }}
                      >
                        {value}
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full transition-[width] duration-500 ease-out"
                        style={{
                          width: `${pct}%`,
                          background: item.color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-lg border border-border bg-card p-5">
            <p className="mb-2 text-[10px] font-bold tracking-widest text-muted-foreground">
              JOB DESCRIPTION
            </p>
            {role.description ? (
              <CollapsibleJobDescription text={role.description} />
            ) : (
              <p className="text-sm italic text-muted-foreground">
                No description provided.
              </p>
            )}
          </div>

          <div className="rounded-lg border border-border bg-card">
            <div className="space-y-3 border-b border-border px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-foreground">
                  Candidates
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
                  placeholder="Search by name or email…"
                  className="w-full bg-transparent text-sm text-foreground outline-none"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead>
                  <tr className="border-b border-border">
                    {["Candidate", "Status", "Rounds", "Score", "Screened"].map(
                      (header, index) => (
                        <th
                          key={header}
                          className={`px-4 py-2.5 text-[10px] font-bold tracking-widest text-muted-foreground ${
                            index === 0 ? "text-left" : "text-right"
                          }`}
                        >
                          {header}
                        </th>
                      ),
                    )}
                    <th className="w-10 px-2 py-2.5" aria-label="Actions" />
                    <th className="w-10 px-2 py-2.5" aria-label="View" />
                  </tr>
                </thead>
                <tbody>
                  {!candidatesLoading && candidates.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-12 text-center text-sm text-muted-foreground"
                      >
                        {debouncedSearch
                          ? "No candidates match your search."
                          : "No candidates screened for this role yet."}
                      </td>
                    </tr>
                  ) : null}
                  {candidates.map((candidate, index) => {
                    const score = toScore(candidate.integrityScore);

                    return (
                      <tr
                        key={candidate.id}
                        onClick={() =>
                          router.push(routes.candidate(candidate.id))
                        }
                        className="group cursor-pointer transition-colors hover:bg-muted/50"
                        style={{
                          borderBottom:
                            index < candidates.length - 1
                              ? "1px solid var(--border)"
                              : "none",
                        }}
                      >
                        <td className="px-4 py-3">
                          <p className="text-sm font-semibold text-foreground group-hover:underline">
                            {candidate.name}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {candidate.email ?? "-"}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end">
                            <StatusBadge status={candidate.status} />
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-xs text-muted-foreground">
                          {candidate.roundsCount}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {score !== null ? (
                            <span
                              className="font-mono text-xs font-bold"
                              style={{ color: getScoreColor(score) }}
                            >
                              {score}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              -
                            </span>
                          )}
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

            {candidatesPagination ? (
              <TablePagination
                meta={{ ...candidatesPagination, from, to }}
                hasPrevPage={hasPrevPage}
                onNextPage={() => {
                  if (candidatesPagination.nextCursor) {
                    goNext(candidatesPagination.nextCursor);
                  }
                }}
                onPrevPage={goPrev}
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  reset();
                }}
              />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
