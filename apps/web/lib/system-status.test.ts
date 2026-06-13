import { describe, expect, it } from "vitest";

import {
  getSystemStatusStyle,
  parseSystemStatus,
} from "@/lib/system-status";

describe("system status", () => {
  it("parses env values with a nominal default", () => {
    expect(parseSystemStatus(undefined)).toBe("nominal");
    expect(parseSystemStatus("")).toBe("nominal");
    expect(parseSystemStatus("nominal")).toBe("nominal");
    expect(parseSystemStatus("MAINTENANCE")).toBe("maintenance");
    expect(parseSystemStatus("outage")).toBe("outage");
    expect(parseSystemStatus("unknown")).toBe("nominal");
  });

  it("returns distinct styles per status", () => {
    const nominal = getSystemStatusStyle("nominal");
    const maintenance = getSystemStatusStyle("maintenance");
    const outage = getSystemStatusStyle("outage");

    expect(maintenance.color).toBe("#0EA5E9");
    expect(outage.color).toBe("#EF4444");
    expect(nominal.color).not.toBe(maintenance.color);
    expect(outage.color).not.toBe(nominal.color);
  });
});
