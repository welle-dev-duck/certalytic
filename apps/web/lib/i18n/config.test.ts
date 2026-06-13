import { describe, expect, it } from "vitest";

import {
  defaultLocale,
  isLocale,
  resolveLocaleFromHeader,
} from "./config";

describe("resolveLocaleFromHeader", () => {
  it("returns English when header is missing", () => {
    expect(resolveLocaleFromHeader(null)).toBe(defaultLocale);
    expect(resolveLocaleFromHeader(undefined)).toBe(defaultLocale);
    expect(resolveLocaleFromHeader("")).toBe(defaultLocale);
  });

  it("prefers the first supported language in order", () => {
    expect(resolveLocaleFromHeader("de-DE,en-US;q=0.9")).toBe("de");
    expect(resolveLocaleFromHeader("en-US,de-DE;q=0.8")).toBe("en");
  });

  it("falls back to English for unsupported languages", () => {
    expect(resolveLocaleFromHeader("fr-FR,es-ES")).toBe("en");
  });
});

describe("isLocale", () => {
  it("accepts supported locales only", () => {
    expect(isLocale("en")).toBe(true);
    expect(isLocale("de")).toBe(true);
    expect(isLocale("fr")).toBe(false);
    expect(isLocale(null)).toBe(false);
  });
});
