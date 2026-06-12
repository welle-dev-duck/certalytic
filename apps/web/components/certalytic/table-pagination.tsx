"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

// TODO: remove option 1 before prod
export const PAGE_SIZES = [1, 10, 25, 50, 100] as const;

export type TablePaginationMeta = {
  limit: number;
  from: number | null;
  to: number | null;
  hasNextPage: boolean;
  nextCursor?: string | null;
};

type TablePaginationProps = {
  meta: TablePaginationMeta;
  hasPrevPage?: boolean;
  pageSizes?: readonly number[];
  onNextPage: () => void;
  onPrevPage: () => void;
  onPageSizeChange: (size: number) => void;
};

export function TablePagination({
  meta,
  hasPrevPage = false,
  pageSizes = PAGE_SIZES,
  onNextPage,
  onPrevPage,
  onPageSizeChange,
}: TablePaginationProps) {
  const showNav = hasPrevPage || meta.hasNextPage;

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-border px-4 py-3 sm:flex-row">
      <div className="flex items-center gap-3">
        <p className="text-xs text-muted-foreground">
          {meta.from !== null && meta.to !== null
            ? `Showing ${meta.from}–${meta.to}`
            : "No rows"}
        </p>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold tracking-widest text-muted-foreground">
            ROWS
          </span>
          <select
            value={meta.limit}
            onChange={(event) =>
              onPageSizeChange(Number(event.target.value))
            }
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

      {showNav ? (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onPrevPage}
            disabled={!hasPrevPage}
            aria-label="Previous page"
            className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground transition-colors disabled:opacity-30"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            type="button"
            onClick={onNextPage}
            disabled={!meta.hasNextPage}
            aria-label="Next page"
            className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground transition-colors disabled:opacity-30"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      ) : null}
    </div>
  );
}
