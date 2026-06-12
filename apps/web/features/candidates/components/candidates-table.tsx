"use client";

import { ChevronRight } from "lucide-react";
import Link from "@/components/ui/link";
import { useRouter } from "next/navigation";

import {
  TablePagination,
  type TablePaginationMeta,
} from "@/components/certalytic/table-pagination";
import { ScoreRing } from "@/components/certalytic/score-ring";
import {
  IntegrityBadge,
  StatusBadge,
} from "@/components/certalytic/status-badge";
import { CandidateRowActions } from "@/features/candidates/components/candidate-row-actions";
import {
  candidateInitials,
  formatCandidateDate,
  integrityAvatarColors,
  toCandidateScore,
} from "@/features/candidates/lib/candidate-table-utils";
import type { CandidateListItem } from "@/features/candidates/types";
import { getIntegrityLevel, getScoreColor } from "@/lib/integrity";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

type CandidatesTableVariant = "full" | "compact" | "role";

type CandidatesTableProps = {
  candidates: CandidateListItem[];
  variant?: CandidatesTableVariant;
  isLoading?: boolean;
  emptyMessage?: string;
  onRerun: (candidate: CandidateListItem) => void;
  onDelete: (candidate: CandidateListItem) => void;
  pagination?: TablePaginationMeta;
  hasPrevPage?: boolean;
  onNextPage?: () => void;
  onPrevPage?: () => void;
  onPageSizeChange?: (size: number) => void;
};

const HEADERS: Record<CandidatesTableVariant, string[]> = {
  full: [
    "Candidate",
    "Role",
    "Status",
    "Score",
    "Integrity",
    "Rounds",
    "Screened",
  ],
  compact: ["Candidate", "Role", "Status", "Score", "Created At"],
  role: ["Candidate", "Status", "Rounds", "Score", "Screened"],
};

function headerAlign(variant: CandidatesTableVariant, index: number): string {
  if (variant === "full") {
    return index <= 1 ? "text-left" : "text-right";
  }

  return index === 0 ? "text-left" : "text-right";
}

export function CandidatesTable({
  candidates,
  variant = "full",
  isLoading = false,
  emptyMessage = "No candidates match the current filters.",
  onRerun,
  onDelete,
  pagination,
  hasPrevPage = false,
  onNextPage,
  onPrevPage,
  onPageSizeChange,
}: CandidatesTableProps) {
  const router = useRouter();
  const headers = HEADERS[variant];
  const colSpan = headers.length + 2;

  if (isLoading) {
    return (
      <div className="px-4 py-12 text-center text-sm text-muted-foreground">
        Loading candidates…
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table
          className={cn(
            "w-full",
            variant === "full" ? "min-w-[800px]" : "min-w-[640px]",
          )}
        >
          <thead>
            <tr className="border-b border-border">
              {headers.map((header, index) => (
                <th
                  key={header}
                  className={cn(
                    "px-4 py-3 text-[10px] font-bold tracking-widest text-muted-foreground",
                    variant === "compact" && "py-2.5 text-left",
                    headerAlign(variant, index),
                  )}
                >
                  {header}
                </th>
              ))}
              <th className="w-10 px-2 py-3" aria-label="Actions" />
              <th className="w-10 px-2 py-3" aria-label="View" />
            </tr>
          </thead>
          <tbody>
            {candidates.length === 0 ? (
              <tr>
                <td
                  colSpan={colSpan}
                  className="px-4 py-12 text-center text-sm text-muted-foreground"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : null}
            {candidates.map((candidate, index) => {
              const score = toCandidateScore(candidate.integrityScore);
              const isComplete = candidate.status === "complete";
              const isLast = index === candidates.length - 1;

              return (
                <tr
                  key={candidate.id}
                  onClick={() => router.push(routes.candidate(candidate.id))}
                  className={cn(
                    "group cursor-pointer transition-colors hover:bg-muted/50",
                    isLast ? undefined : "border-b border-border",
                  )}
                  style={
                    variant === "full" && !isLast
                      ? { borderBottom: "1px solid var(--c-border)" }
                      : undefined
                  }
                >
                  <td className="px-4 py-3">
                    {variant === "role" ? (
                      <>
                        <p className="text-sm font-semibold text-foreground group-hover:underline">
                          {candidate.name}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {candidate.email ?? "-"}
                        </p>
                      </>
                    ) : (
                      <div className="flex items-center gap-2.5">
                        {variant === "full" || variant === "compact" ? (
                          <CandidateAvatar
                            candidate={candidate}
                            score={score}
                            isComplete={isComplete}
                            compact={variant === "compact"}
                          />
                        ) : null}
                        <div>
                          <p
                            className={cn(
                              "text-sm font-semibold text-foreground group-hover:underline",
                              variant === "compact" && "group-hover:underline",
                            )}
                          >
                            {candidate.name}
                          </p>
                          {variant === "full" && candidate.email ? (
                            <p className="text-[10px] text-muted-foreground">
                              {candidate.email}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    )}
                  </td>

                  {variant !== "role" ? (
                    <td
                      className={cn(
                        "px-4 py-3",
                        variant === "compact" &&
                          "text-xs text-muted-foreground",
                      )}
                      onClick={(event) => event.stopPropagation()}
                    >
                      {variant === "full" &&
                      candidate.roleId &&
                      candidate.roleTitle ? (
                        <Link
                          href={routes.role(candidate.roleId)}
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
                  ) : null}

                  <td
                    className={cn(
                      "px-4 py-3",
                      variant !== "compact" && "text-right",
                    )}
                  >
                    <div
                      className={cn(
                        variant !== "compact" && "flex justify-end",
                      )}
                    >
                      <StatusBadge status={candidate.status} />
                    </div>
                  </td>

                  {variant === "role" ? (
                    <td className="px-4 py-3 text-right font-mono text-xs text-muted-foreground">
                      {candidate.roundsCount}
                    </td>
                  ) : null}

                  <td className="px-4 py-3">
                    <div
                      className={cn(
                        variant !== "compact" && "flex justify-end",
                      )}
                    >
                      {isComplete && score !== null ? (
                        variant === "role" ? (
                          <span
                            className="font-mono text-xs font-bold"
                            style={{ color: getScoreColor(score) }}
                          >
                            {score}
                          </span>
                        ) : (
                          <ScoreRing
                            score={score}
                            size={variant === "compact" ? 32 : 36}
                            strokeWidth={3}
                            labelSize="sm"
                          />
                        )
                      ) : (
                        <span
                          className={cn(
                            "text-muted-foreground",
                            variant === "role" || variant === "compact"
                              ? "text-xs"
                              : "font-mono text-sm",
                          )}
                        >
                          -
                        </span>
                      )}
                    </div>
                  </td>

                  {variant === "full" ? (
                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        {isComplete && score !== null ? (
                          <IntegrityBadge level={getIntegrityLevel(score)} />
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            -
                          </span>
                        )}
                      </div>
                    </td>
                  ) : null}

                  {variant === "full" ? (
                    <td className="px-4 py-3 text-right font-mono text-xs text-muted-foreground">
                      {candidate.roundsCount}
                    </td>
                  ) : null}

                  <td className="px-4 py-3 text-right font-mono text-[11px] text-muted-foreground">
                    {variant === "compact"
                      ? candidate.createdAt
                        ? new Date(candidate.createdAt).toLocaleDateString()
                        : "-"
                      : formatCandidateDate(candidate.processedAt)}
                  </td>

                  <td className="px-2 py-3 text-right">
                    <CandidateRowActions
                      candidateId={candidate.id}
                      status={candidate.status}
                      onRerun={() => onRerun(candidate)}
                      onDelete={() => onDelete(candidate)}
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

      {pagination && onNextPage && onPrevPage && onPageSizeChange ? (
        <TablePagination
          meta={pagination}
          hasPrevPage={hasPrevPage}
          onNextPage={onNextPage}
          onPrevPage={onPrevPage}
          onPageSizeChange={onPageSizeChange}
        />
      ) : null}
    </>
  );
}

function CandidateAvatar({
  candidate,
  score,
  isComplete,
  compact,
}: {
  candidate: CandidateListItem;
  score: number | null;
  isComplete: boolean;
  compact: boolean;
}) {
  const colors = integrityAvatarColors(score ?? 0, isComplete);

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded text-xs font-bold",
        compact ? "h-7 w-7" : "h-8 w-8",
      )}
      style={{
        background: isComplete
          ? colors.background
          : compact
            ? "var(--c-surface-2)"
            : "color-mix(in oklch, var(--primary) 10%, transparent)",
        color: isComplete
          ? colors.color
          : compact
            ? "var(--c-muted)"
            : "var(--c-cyan)",
      }}
    >
      {candidateInitials(candidate.name)}
    </div>
  );
}
