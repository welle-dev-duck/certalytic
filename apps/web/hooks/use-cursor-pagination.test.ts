import { describe, expect, it } from "vitest";

import { cursorPageRange } from "@/hooks/use-cursor-pagination";

describe("cursorPageRange", () => {
  it("returns null range for empty pages", () => {
    expect(cursorPageRange(0, 25, 0)).toEqual({ from: null, to: null });
  });

  it("computes ranges from page index and size", () => {
    expect(cursorPageRange(0, 25, 10)).toEqual({ from: 1, to: 10 });
    expect(cursorPageRange(1, 25, 25)).toEqual({ from: 26, to: 50 });
  });
});
