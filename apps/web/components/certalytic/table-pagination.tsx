"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

export const PAGE_SIZES = [10, 25, 50, 100] as const;

export type TablePaginationMeta = {
  page: number;
  limit: number;
  total: number;
  lastPage: number;
  from: number | null;
  to: number | null;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

type TablePaginationProps = {
  meta: TablePaginationMeta;
  pageSizes?: readonly number[];
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
};

export function TablePagination({
  meta,
  pageSizes = PAGE_SIZES,
  onPageChange,
  onPageSizeChange,
}: TablePaginationProps) {
  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-border px-4 py-3 sm:flex-row">
      <div className="flex items-center gap-3">
        <p className="text-xs text-muted-foreground">
          Showing {meta.from ?? 0}–{meta.to ?? 0} of {meta.total}
        </p>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold tracking-widest text-muted-foreground">
            ROWS
          </span>
          <select
            value={meta.limit}
            onChange={(event) => onPageSizeChange(Number(event.value))}
            className="appearance-none rounded border border-border bg-muted px-2 py-1 text-xs text-foreground outline-none"
          >
            {pageSizes.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
      </div>

      {meta.lastPage > 1 && (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onPageChange(meta.page - 1)}
            disabled={!meta.hasPrevPage}
            aria-label="Previous page"
            className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground transition-colors disabled:opacity-30"
          >
            <ChevronLeft size={14} />
          </button>
          {Array.from({ length: meta.lastPage }, (_, index) => index + 1).map(
            (pageNumber) => (
              <button
                key={pageNumber}
                type="button"
                onClick={() => onPageChange(pageNumber)}
                className={cn(
                  "flex h-7 min-w-7 items-center justify-center rounded px-2 text-xs font-semibold transition-colors",
                  pageNumber === meta.page
                    ? "border border-primary/35 bg-primary/15 text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {pageNumber}
              </button>
            ),
          )}
          <button
            type="button"
            onClick={() => onPageChange(meta.page + 1)}
            disabled={!meta.hasNextPage}
            aria-label="Next page"
            className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground transition-colors disabled:opacity-30"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
