import { describe, expect, it } from "vitest";
import { getDateInTimezone } from "@/pages/api/lib/getDateInTimezone";

describe("getDateInTimezone", () => {
  it("returns the date in the target timezone", () => {
    expect(
      getDateInTimezone("2025-10-04T22:00:00+00:00", "Europe/Stockholm"),
    ).toBe("2025-10-05");
  });

  it("handles daylight-saving offsets correctly", () => {
    expect(
      getDateInTimezone("2025-03-09T01:30:00-05:00", "America/New_York"),
    ).toBe("2025-03-09");
  });

  it("falls back to direct date when timezone resolution fails", () => {
    expect(getDateInTimezone("2025-10-28T12:00:00Z", "Invalid/Timezone")).toBe(
      "2025-10-28",
    );
  });

  it("returns null when the value cannot be parsed as a date", () => {
    expect(getDateInTimezone("invalid", "Asia/Tokyo")).toBeNull();
  });
});
