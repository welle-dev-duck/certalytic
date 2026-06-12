"use client";

import { Button } from "@/components/ui/button";

type CursorPaginationProps = {
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
  loadedCount: number;
};

export function CursorPagination({
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
  loadedCount,
}: CursorPaginationProps) {
  if (!hasNextPage && loadedCount === 0) return null;

  return (
    <div className="flex items-center justify-between border-t border-border px-4 py-3">
      <p className="text-xs text-muted-foreground">
        Showing {loadedCount} result{loadedCount === 1 ? "" : "s"}
      </p>
      {hasNextPage && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isFetchingNextPage}
          onClick={onLoadMore}
        >
          {isFetchingNextPage ? "Loading…" : "Load more"}
        </Button>
      )}
    </div>
  );
}
