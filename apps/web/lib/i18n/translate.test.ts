import { describe, expect, it } from "vitest";

import { createTranslator } from "./translate";

describe("createTranslator", () => {
  const t = createTranslator({
    greeting: "Hello",
    nested: {
      welcome: "Welcome, {name}",
    },
  });

  it("returns nested message values", () => {
    expect(t("greeting")).toBe("Hello");
    expect(t("nested.welcome", { name: "Ada" })).toBe("Welcome, Ada");
  });

  it("returns the key when a message is missing", () => {
    expect(t("missing.key")).toBe("missing.key");
  });
});
