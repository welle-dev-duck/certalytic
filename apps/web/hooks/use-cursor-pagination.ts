"use client";

import { useCallback, useState } from "react";

export function useCursorPagination() {
  const [cursorStack, setCursorStack] = useState<(string | undefined)[]>([
    undefined,
  ]);
  const cursor = cursorStack[cursorStack.length - 1];
  const hasPrevPage = cursorStack.length > 1;
  const pageIndex = cursorStack.length - 1;

  const goNext = useCallback((nextCursor: string) => {
    setCursorStack((stack) => [...stack, nextCursor]);
  }, []);

  const goPrev = useCallback(() => {
    setCursorStack((stack) => (stack.length > 1 ? stack.slice(0, -1) : stack));
  }, []);

  const reset = useCallback(() => {
    setCursorStack([undefined]);
  }, []);

  return { cursor, hasPrevPage, pageIndex, goNext, goPrev, reset };
}

export function cursorPageRange(
  pageIndex: number,
  pageSize: number,
  rowCount: number,
): { from: number | null; to: number | null } {
  if (rowCount === 0) {
    return { from: null, to: null };
  }

  const from = pageIndex * pageSize + 1;
  return { from, to: from + rowCount - 1 };
}
