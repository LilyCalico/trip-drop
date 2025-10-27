import { describe, expect, it } from "vitest";
import { createUtcDateTimeForDB } from "@/lib/functions/createUtcVisitDateTime";

describe("createUtcDateTimeForDB", () => {
  it("Europe/Stockholm: 2025-10-28 22:00 -> 2025-10-28T21:00:00Z", () => {
    const result = createUtcDateTimeForDB(
      "2025-10-28",
      "22:00",
      "Europe/Stockholm",
    );
    expect(result).toBe("2025-10-28T21:00:00.000Z");
  });

  it("Asia/Tokyo: 2025-10-28 10:00 -> 2025-10-28T01:00:00Z", () => {
    const result = createUtcDateTimeForDB("2025-10-28", "10:00", "Asia/Tokyo");
    expect(result).toBe("2025-10-28T01:00:00.000Z");
  });

  it("Handles invalid date strings", () => {
    expect(createUtcDateTimeForDB("invalid", "10:00", "Asia/Tokyo")).toBeNull();
  });

  it("Handles invalid time strings", () => {
    expect(
      createUtcDateTimeForDB("2025-10-28", "25:00", "Asia/Tokyo"),
    ).toBeNull();
  });

  it("Returns null when timezone resolution fails", () => {
    const result = createUtcDateTimeForDB("2025-10-28", "10:00", "Invalid/TZ");
    expect(result).toBeNull();
  });
});
