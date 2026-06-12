"use client";

import { useEffect, useRef, useState } from "react";

export function useDebouncedSearch(
  delayMs = 350,
  onDebouncedChange?: () => void,
) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }

    const timeout = setTimeout(() => {
      setDebouncedSearch(search);
      onDebouncedChange?.();
    }, delayMs);

    return () => clearTimeout(timeout);
  }, [delayMs, onDebouncedChange, search]);

  return { search, setSearch, debouncedSearch, setDebouncedSearch };
}
