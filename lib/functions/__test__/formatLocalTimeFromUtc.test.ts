import { describe, expect, it } from "vitest";
import { formatLocalTimeFromUtc } from "@/lib/functions/formatLocalTimeFromUtc";

describe("formatLocalTimeFromUtc", () => {
  it("converts UTC time to local time in Europe/Stockholm", () => {
    const result = formatLocalTimeFromUtc(
      "2025-10-04T23:00:00+00:00",
      "Europe/Stockholm",
    );

    expect(result).toBe("01:00");
  });

  it("handles daylight saving time transitions", () => {
    const result = formatLocalTimeFromUtc(
      "2025-10-26T00:00:00+00:00",
      "Europe/Stockholm",
    );
    const result2 = formatLocalTimeFromUtc(
      "2025-10-26T01:00:00+00:00",
      "Europe/Stockholm",
    );
    const sameTime = "02:00";

    expect(result).toBe(sameTime);
    expect(result2).toBe(sameTime);
  });

  it("handles daylight saving time transitions", () => {
    const result = formatLocalTimeFromUtc(
      "2025-03-30T00:30:00+00:00",
      "Europe/Stockholm",
    );

    expect(result).toBe("01:30");
  });

  it("returns null for invalid datetime", () => {
    const result = formatLocalTimeFromUtc("invalid", "Europe/Stockholm");

    expect(result).toBeNull();
  });

  it("returns null for invalid timezone", () => {
    const result = formatLocalTimeFromUtc(
      "2025-10-04T23:00:00+00:00",
      "Invalid/Timezone",
    );

    expect(result).toBeNull();
  });
});
