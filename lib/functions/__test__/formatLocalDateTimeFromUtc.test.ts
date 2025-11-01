import { describe, expect, it } from "vitest";
import { formatLocalDateTimeFromUtc } from "@/lib/functions/formatLocalDateTimeFromUtc";

describe("formatLocalDateTimeFromUtc", () => {
  it("converts UTC time to local date time in Europe/Stockholm", () => {
    const result = formatLocalDateTimeFromUtc(
      "2025-10-04T23:00:00+00:00",
      "Europe/Stockholm",
    );

    expect(result).toBe("10/05 01:00");
  });

  it("handles daylight saving fallback", () => {
    const first = formatLocalDateTimeFromUtc(
      "2025-10-26T00:00:00+00:00",
      "Europe/Stockholm",
    );
    const second = formatLocalDateTimeFromUtc(
      "2025-10-26T01:00:00+00:00",
      "Europe/Stockholm",
    );

    expect(first).toBe("10/26 02:00");
    expect(second).toBe("10/26 02:00");
  });

  it("returns null for invalid datetime", () => {
    const result = formatLocalDateTimeFromUtc("invalid", "Europe/Stockholm");

    expect(result).toBeNull();
  });

  it("returns null for invalid timezone", () => {
    const result = formatLocalDateTimeFromUtc(
      "2025-10-04T23:00:00+00:00",
      "Invalid/Timezone",
    );

    expect(result).toBeNull();
  });
});
