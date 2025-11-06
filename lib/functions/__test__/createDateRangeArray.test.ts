import { describe, expect, it } from "vitest";

import createDateRangeArray from "../createDateRangeArray";

describe("createDateRange", () => {
  it("returns inclusive range between start and end", () => {
    const result = createDateRangeArray("2025-10-10", "2025-10-13");
    expect(result).toEqual([
      "2025-10-10",
      "2025-10-11",
      "2025-10-12",
      "2025-10-13",
    ]);
  });

  it("returns inclusive range between start and end (cross month)", () => {
    const result = createDateRangeArray("2025-10-30", "2025-11-01");
    expect(result).toEqual(["2025-10-30", "2025-10-31", "2025-11-01"]);
  });

  it("returns inclusive range between february and march (leap year)", () => {
    const result = createDateRangeArray("2028-02-28", "2028-03-01");
    expect(result).toEqual(["2028-02-28", "2028-02-29", "2028-03-01"]);
  });

  it("handles single-day range", () => {
    const result = createDateRangeArray("2025-10-10", "2025-10-10");
    expect(result).toEqual(["2025-10-10"]);
  });

  it("throws when start is after end", () => {
    expect(() => createDateRangeArray("2025-10-13", "2025-10-10")).toThrow(
      RangeError,
    );
  });

  it("throws on invalid dates", () => {
    expect(() => createDateRangeArray("invalid", "2025-10-10")).toThrow(
      TypeError,
    );
    expect(() => createDateRangeArray("2025-10-10", "invalid")).toThrow(
      TypeError,
    );
  });

  it("throws when dates missing", () => {
    expect(() => createDateRangeArray(undefined, "2025-10-10")).toThrow(
      TypeError,
    );
    expect(() => createDateRangeArray("2025-10-10", undefined)).toThrow(
      TypeError,
    );
  });
});
