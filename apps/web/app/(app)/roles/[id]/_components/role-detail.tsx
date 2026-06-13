"use client";

import {
  ArrowLeft,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import Link from "@/components/ui/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { ScoreRing } from "@/components/certalytic/score-ring";
import { Button } from "@/components/ui/button";
import { CandidatesTable } from "@/features/candidates/components/candidates-table";
import { ScreeningDialogs } from "@/features/candidates/components/screening-dialogs";
import { useCandidateScreeningDialogs } from "@/features/candidates/hooks/use-candidate-screening-dialogs";
import { useDebouncedSearch } from "@/features/candidates/hooks/use-debounced-search";
import { useCandidates } from "@/features/candidates/hooks/use-candidates";
import {
  formatCandidateDate,
} from "@/features/candidates/lib/candidate-table-utils";
import type { CandidateListItem } from "@/features/candidates/types";
import { RoleExportAction } from "@/features/roles/components/role-export-action";
import { RoleFormDialog } from "@/features/roles/components/role-form-dialog";
import {
  useDeleteRole,
  useRole,
} from "@/features/roles/hooks/use-roles";
import { useCursorPagination, cursorPageRange } from "@/hooks/use-cursor-pagination";
import { useTranslations } from "@/lib/i18n/client";
import { getIntegrityDistributionLabels } from "@/lib/integrity";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

function CollapsibleJobDescription({ text }: { text: string }) {
  const t = useTranslations("app");
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
          {expanded ? t("roles.detail.showLess") : t("roles.detail.showMore")}
        </button>
      ) : null}
    </div>
  );
}

export function RoleDetail({ roleId }: { roleId: string }) {
  const t = useTranslations("app");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [pageSize, setPageSize] = useState(25);
  const { cursor, hasPrevPage, pageIndex, goNext, goPrev, reset } =
    useCursorPagination();
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
  const { search, setSearch, debouncedSearch } = useDebouncedSearch(350, reset);

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
    reset();
  }, [pageSize, reset]);

  if (isLoading || !role) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center p-6 text-sm text-muted-foreground">
        {t("roles.detail.loading")}
      </div>
    );
  }

  const stats = role.stats;

  function openDeleteCandidate(candidate: CandidateListItem) {
    openDelete({ id: candidate.id, name: candidate.name });
  }

  function openRerunCandidate(candidate: CandidateListItem) {
    openRerun({ id: candidate.id, name: candidate.name });
  }

  function handleDeleteRole() {
    if (
      !confirm(t("roles.detail.deleteConfirm", { title: role?.title ?? "" }))
    ) {
      return;
    }

    void deleteRole.mutateAsync(roleId).then(() => {
      router.push(routes.roles());
    });
  }

  return (
    <div className="space-y-5 p-6">
      <ScreeningDialogs
        screenOpen={screenOpen}
        onScreenOpenChange={setScreenOpen}
        deleteOpen={deleteOpen}
        onDeleteOpenChange={handleDeleteOpenChange}
        rerunOpen={rerunOpen}
        onRerunOpenChange={handleRerunOpenChange}
        selectedCandidate={selectedCandidate}
        preselectedRoleId={roleId}
        lockRole
      />
      <RoleFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        mode="edit"
        role={role}
      />

      <div className="flex items-center justify-between gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href={routes.roles()}>
            <ArrowLeft size={13} />
            {t("roles.detail.backToRoles")}
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
            {t("roles.detail.edit")}
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
            {t("roles.detail.delete")}
          </Button>
        </div>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-foreground">{role.title}</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {t("roles.detail.created", {
            date: formatCandidateDate(role.createdAt),
          })}{" "}
          ·{" "}
          {role.candidatesCount === 1
            ? t("roles.detail.screeningsSingular", {
                count: role.candidatesCount,
              })
            : t("roles.detail.screeningsPlural", {
                count: role.candidatesCount,
              })}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[300px_1fr]">
        <div className="space-y-5">
          <div className="rounded-lg border border-border bg-card p-5">
            <p className="mb-4 text-[10px] font-bold tracking-widest text-muted-foreground">
              {t("roles.detail.avgIntegrity")}
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
                  {t("roles.detail.noScores")}
                </div>
              )}
              <p className="mt-3 text-xs text-muted-foreground">
                {stats.scored === 1
                  ? t("roles.detail.acrossScoredSingular", {
                      count: stats.scored,
                    })
                  : t("roles.detail.acrossScoredPlural", {
                      count: stats.scored,
                    })}
              </p>
            </div>

            <div className="mt-5 space-y-2.5">
              {getIntegrityDistributionLabels(tCommon).map((item) => {
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
              {t("roles.detail.jobDescription")}
            </p>
            {role.description ? (
              <CollapsibleJobDescription text={role.description} />
            ) : (
              <p className="text-sm italic text-muted-foreground">
                {t("roles.detail.noDescription")}
              </p>
            )}
          </div>

          <div className="rounded-lg border border-border bg-card">
            <div className="space-y-3 border-b border-border px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-foreground">
                  {t("roles.detail.candidates")}
                </p>
                <Button size="sm" onClick={() => setScreenOpen(true)}>
                  <Plus size={13} />
                  {t("roles.detail.newCandidate")}
                </Button>
              </div>
              <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2">
                <Search size={14} className="shrink-0 text-muted-foreground" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={t("roles.detail.searchPlaceholder")}
                  className="w-full bg-transparent text-sm text-foreground outline-none"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <CandidatesTable
                candidates={candidates}
                variant="role"
                isLoading={candidatesLoading}
                emptyMessage={
                  debouncedSearch
                    ? t("candidates.empty.roleSearch")
                    : t("candidates.empty.roleDefault")
                }
                onRerun={openRerunCandidate}
                onDelete={openDeleteCandidate}
                pagination={
                  candidatesPagination
                    ? { ...candidatesPagination, from, to }
                    : undefined
                }
                hasPrevPage={hasPrevPage}
                onNextPage={() => {
                  if (candidatesPagination?.nextCursor) {
                    goNext(candidatesPagination.nextCursor);
                  }
                }}
                onPrevPage={goPrev}
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  reset();
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
