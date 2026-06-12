"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export type Appearance = "light" | "dark" | "system";

export function useAppearance() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const appearance = (theme ?? "dark") as Appearance;

  return {
    appearance,
    resolvedTheme: mounted ? resolvedTheme : "dark",
    updateAppearance: (value: Appearance) => setTheme(value),
    mounted,
  };
}
