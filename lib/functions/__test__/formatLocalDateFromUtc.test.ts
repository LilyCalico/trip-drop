import { describe, expect, it } from "vitest";
import { formatLocalDateFromUtc } from "@/lib/functions/formatLocalDateFromUtc";

describe("formatLocalDateFromUtc", () => {
  it("converts UTC date to local date in Europe/Stockholm", () => {
    const result = formatLocalDateFromUtc(
      "2025-10-04T23:00:00+00:00",
      "Europe/Stockholm",
    );

    expect(result).toBe("2025-10-05");
  });

  it("handles daylight saving time fall-back overlap", () => {
    const first = formatLocalDateFromUtc(
      "2025-10-26T00:00:00+00:00",
      "Europe/Stockholm",
    );
    const second = formatLocalDateFromUtc(
      "2025-10-26T01:00:00+00:00",
      "Europe/Stockholm",
    );

    expect(first).toBe("2025-10-26");
    expect(second).toBe("2025-10-26");
  });

  it("handles daylight saving time spring-forward gap", () => {
    const result = formatLocalDateFromUtc(
      "2025-03-30T00:30:00+00:00",
      "Europe/Stockholm",
    );

    expect(result).toBe("2025-03-30");
  });

  it("returns null for invalid datetime", () => {
    const result = formatLocalDateFromUtc("invalid", "Europe/Stockholm");

    expect(result).toBeNull();
  });

  it("returns null for invalid timezone", () => {
    const result = formatLocalDateFromUtc(
      "2025-10-04T23:00:00+00:00",
      "Invalid/Timezone",
    );

    expect(result).toBeNull();
  });
});
