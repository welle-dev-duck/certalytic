import { describe, expect, it } from "vitest";

import {
  getIntegrityLevel,
  getMetricBarColor,
  getRiskVectorColor,
  getScoreBackground,
  getScoreColor,
  getTokenUsageBarColor,
  getAuthenticityStyle,
} from "@/lib/integrity";

describe("integrity helpers", () => {
  it("maps scores to integrity levels", () => {
    expect(getIntegrityLevel(80)).toBe("high");
    expect(getIntegrityLevel(60)).toBe("medium");
    expect(getIntegrityLevel(40)).toBe("low");
  });

  it("returns consistent score colors", () => {
    expect(getScoreColor(80)).toBe("#10B981");
    expect(getScoreColor(60)).toBe("#F59E0B");
    expect(getScoreColor(40)).toBe("#EF4444");
  });

  it("returns rgba backgrounds", () => {
    expect(getScoreBackground(80)).toContain("16,185,129");
  });

  it("returns token usage bar colors by ratio", () => {
    expect(getTokenUsageBarColor(0.5)).toBe("var(--primary)");
    expect(getTokenUsageBarColor(0.7)).toBe("#F59E0B");
    expect(getTokenUsageBarColor(0.9)).toBe("#EF4444");
  });

  it("returns metric and risk vector colors", () => {
    expect(getMetricBarColor(80)).toBe("#10B981");
    expect(getMetricBarColor(50)).toBe("#F59E0B");
    expect(getRiskVectorColor(70)).toBe("#EF4444");
    expect(getRiskVectorColor(20)).toBe("#10B981");
  });

  it("returns authenticity badge styles", () => {
    expect(getAuthenticityStyle(true).color).toBe("#10B981");
    expect(getAuthenticityStyle(false).color).toBe("#EF4444");
  });
});
