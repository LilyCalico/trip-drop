import { describe, expect, it } from "vitest";
import { extractLocalDateTimeParts } from "../convertUtcToLocalParts";

describe("extractLocalDateTimeParts", () => {
  describe("Valid cases", () => {
    it("converts UTC to Europe/Stockholm local time", () => {
      const result = extractLocalDateTimeParts({
        datetimeUtc: "2025-10-04T23:00:00.000Z",
        timezone: "Europe/Stockholm",
      });

      expect(result).toEqual({
        date: "2025-10-05",
        time: "01:00",
      });
    });

    it("converts UTC to Asia/Tokyo local time", () => {
      const result = extractLocalDateTimeParts({
        datetimeUtc: "2025-10-28T01:00:00.000Z",
        timezone: "Asia/Tokyo",
      });

      expect(result).toEqual({
        date: "2025-10-28",
        time: "10:00",
      });
    });

    it("converts UTC to America/New_York local time", () => {
      const result = extractLocalDateTimeParts({
        datetimeUtc: "2025-10-28T19:00:00.000Z",
        timezone: "America/New_York",
      });

      expect(result).toEqual({
        date: "2025-10-28",
        time: "15:00",
      });
    });

    it("handles date boundary crossing (UTC to local)", () => {
      const result = extractLocalDateTimeParts({
        datetimeUtc: "2025-10-04T22:00:00.000Z",
        timezone: "Asia/Tokyo",
      });

      expect(result).toEqual({
        date: "2025-10-05",
        time: "07:00",
      });
    });

    it("handles midnight in UTC", () => {
      const result = extractLocalDateTimeParts({
        datetimeUtc: "2025-10-28T00:00:00.000Z",
        timezone: "Asia/Tokyo",
      });

      expect(result).toEqual({
        date: "2025-10-28",
        time: "09:00",
      });
    });

    it("handles ISO string with timezone offset", () => {
      const result = extractLocalDateTimeParts({
        datetimeUtc: "2025-10-28T10:00:00+00:00",
        timezone: "Europe/Stockholm",
      });

      expect(result).toEqual({
        date: "2025-10-28",
        time: "11:00",
      });
    });
  });

  describe("Error cases", () => {
    it("returns null for null datetimeUtc", () => {
      const result = extractLocalDateTimeParts({
        datetimeUtc: null,
        timezone: "Asia/Tokyo",
      });

      expect(result).toBeNull();
    });

    it("returns null for undefined datetimeUtc", () => {
      const result = extractLocalDateTimeParts({
        datetimeUtc: undefined,
        timezone: "Asia/Tokyo",
      });

      expect(result).toBeNull();
    });

    it("returns null for null timezone", () => {
      const result = extractLocalDateTimeParts({
        datetimeUtc: "2025-10-28T10:00:00.000Z",
        timezone: null,
      });

      expect(result).toBeNull();
    });

    it("returns null for undefined timezone", () => {
      const result = extractLocalDateTimeParts({
        datetimeUtc: "2025-10-28T10:00:00.000Z",
        timezone: undefined,
      });

      expect(result).toBeNull();
    });

    it("returns null for invalid datetime string", () => {
      const result = extractLocalDateTimeParts({
        datetimeUtc: "invalid-datetime",
        timezone: "Asia/Tokyo",
      });

      expect(result).toBeNull();
    });

    it("returns null for empty datetime string", () => {
      const result = extractLocalDateTimeParts({
        datetimeUtc: "",
        timezone: "Asia/Tokyo",
      });

      expect(result).toBeNull();
    });

    it("returns null for invalid timezone", () => {
      const result = extractLocalDateTimeParts({
        datetimeUtc: "2025-10-28T10:00:00.000Z",
        timezone: "Invalid/Timezone",
      });

      expect(result).toBeNull();
    });
  });

  describe("Daylight saving time", () => {
    it("handles DST transition in Europe/Stockholm (fallback)", () => {
      // 2025-10-26 is when DST ends in Stockholm
      const result1 = extractLocalDateTimeParts({
        datetimeUtc: "2025-10-26T00:00:00.000Z",
        timezone: "Europe/Stockholm",
      });

      const result2 = extractLocalDateTimeParts({
        datetimeUtc: "2025-10-26T01:00:00.000Z",
        timezone: "Europe/Stockholm",
      });

      // Both should show 02:00 local time (due to DST fallback)
      expect(result1?.time).toBe("02:00");
      expect(result2?.time).toBe("02:00");
    });
  });

  describe("Edge cases", () => {
    it("handles datetime with milliseconds", () => {
      const result = extractLocalDateTimeParts({
        datetimeUtc: "2025-10-28T10:30:45.123Z",
        timezone: "Asia/Tokyo",
      });

      expect(result).toEqual({
        date: "2025-10-28",
        time: "19:30",
      });
    });

    it("handles datetime with seconds", () => {
      const result = extractLocalDateTimeParts({
        datetimeUtc: "2025-10-28T10:30:45Z",
        timezone: "Asia/Tokyo",
      });

      expect(result).toEqual({
        date: "2025-10-28",
        time: "19:30",
      });
    });

    it("handles year boundary", () => {
      const result = extractLocalDateTimeParts({
        datetimeUtc: "2024-12-31T15:00:00.000Z",
        timezone: "Asia/Tokyo",
      });

      expect(result).toEqual({
        date: "2025-01-01",
        time: "00:00",
      });
    });
  });
});
