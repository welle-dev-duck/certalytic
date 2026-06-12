"use client";

import { Plus, Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { CandidatesTable } from "@/features/candidates/components/candidates-table";
import { ScreeningDialogs } from "@/features/candidates/components/screening-dialogs";
import { useCandidateScreeningDialogs } from "@/features/candidates/hooks/use-candidate-screening-dialogs";
import { useDebouncedSearch } from "@/features/candidates/hooks/use-debounced-search";
import { useCandidates } from "@/features/candidates/hooks/use-candidates";
import { useBillingUsage } from "@/features/billing/hooks/use-billing";
import { useCursorPagination, cursorPageRange } from "@/hooks/use-cursor-pagination";
import { routes } from "@/lib/routes";

const STATUSES = ["pending", "processing", "complete", "failed"] as const;

export function CandidatesList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
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

  const { data: usage } = useBillingUsage();

  const { data, isLoading } = useCandidates({
    search: debouncedSearch || undefined,
    status: statusFilter ?? undefined,
    limit: pageSize,
    cursor,
  });

  const candidates = data?.data ?? [];
  const pagination = data?.pagination;
  const { from, to } = cursorPageRange(pageIndex, pageSize, candidates.length);

  useEffect(() => {
    if (searchParams.get("screen") === "1") {
      setScreenOpen(true);
      router.replace(routes.candidates());
    }
  }, [router, searchParams, setScreenOpen]);

  useEffect(() => {
    reset();
  }, [statusFilter, pageSize, reset]);

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
      />

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
          <Button size="sm" onClick={() => setScreenOpen(true)}>
            <Plus size={13} />
            New Candidate
          </Button>
        </div>

        <CandidatesTable
          candidates={candidates}
          variant="full"
          isLoading={isLoading}
          onRerun={openRerun}
          onDelete={openDelete}
          pagination={
            pagination
              ? { ...pagination, from, to }
              : undefined
          }
          hasPrevPage={hasPrevPage}
          onNextPage={() => {
            if (pagination?.nextCursor) {
              goNext(pagination.nextCursor);
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
  );
}
