import { describe, expect, it } from "vitest";

import { createDateRange } from "@/lib/functions/createDateRange";

describe("createDateRange", () => {
  it("returns inclusive range between start and end", () => {
    const result = createDateRange("2025-10-10", "2025-10-13");
    expect(result).toEqual([
      "2025-10-10",
      "2025-10-11",
      "2025-10-12",
      "2025-10-13",
    ]);
  });

  it("returns inclusive range between start and end (cross month)", () => {
    const result = createDateRange("2025-10-30", "2025-11-01");
    expect(result).toEqual(["2025-10-30", "2025-10-31", "2025-11-01"]);
  });

  it("returns inclusive range between february and march (leap year)", () => {
    const result = createDateRange("2028-02-28", "2028-03-01");
    expect(result).toEqual(["2028-02-28", "2028-02-29", "2028-03-01"]);
  });

  it("handles single-day range", () => {
    const result = createDateRange("2025-10-10", "2025-10-10");
    expect(result).toEqual(["2025-10-10"]);
  });

  it("throws when start is after end", () => {
    expect(() => createDateRange("2025-10-13", "2025-10-10")).toThrow(
      RangeError,
    );
  });

  it("throws on invalid dates", () => {
    expect(() => createDateRange("invalid", "2025-10-10")).toThrow(TypeError);
    expect(() => createDateRange("2025-10-10", "invalid")).toThrow(TypeError);
  });

  it("throws when dates missing", () => {
    // @ts-expect-error testing runtime validation
    expect(() => createDateRange(undefined, "2025-10-10")).toThrow(TypeError);
    // @ts-expect-error testing runtime validation
    expect(() => createDateRange("2025-10-10", undefined)).toThrow(TypeError);
  });
});
