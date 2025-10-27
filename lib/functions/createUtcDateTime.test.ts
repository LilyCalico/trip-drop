import { describe, expect, it } from "vitest";
import { createUtcDateTimeForDB } from "@/lib/functions/createUtcDateTime";

describe("createUtcDateTimeForDB", () => {
  describe("Valid cases", () => {
    it("Europe/Stockholm: 2025-10-28 22:00 -> 2025-10-28T21:00:00Z", () => {
      const result = createUtcDateTimeForDB({
        selectedDate: "2025-10-28",
        selectedTime: "22:00",
        selectedTimezone: "Europe/Stockholm",
      });
      expect(result).toBe("2025-10-28T21:00:00.000Z");
    });

    it("Asia/Tokyo: 2025-10-28 10:00 -> 2025-10-28T01:00:00Z", () => {
      const result = createUtcDateTimeForDB({
        selectedDate: "2025-10-28",
        selectedTime: "10:00",
        selectedTimezone: "Asia/Tokyo",
      });
      expect(result).toBe("2025-10-28T01:00:00.000Z");
    });

    it("America/New_York: 2025-10-28 15:30 -> correct UTC time", () => {
      const result = createUtcDateTimeForDB({
        selectedDate: "2025-10-28",
        selectedTime: "15:30",
        selectedTimezone: "America/New_York",
      });
      expect(result).toMatch(/2025-10-28T\d{2}:30:00\.000Z/);
    });
  });

  describe("Error cases", () => {
    it("handles invalid date strings", () => {
      expect(
        createUtcDateTimeForDB({
          selectedDate: "invalid",
          selectedTime: "10:00",
          selectedTimezone: "Asia/Tokyo",
        }),
      ).toBeNull();
    });

    it("handles invalid time strings", () => {
      expect(
        createUtcDateTimeForDB({
          selectedDate: "2025-10-28",
          selectedTime: "25:00",
          selectedTimezone: "Asia/Tokyo",
        }),
      ).toBeNull();
    });

    it("handles invalid time strings with negative values", () => {
      expect(
        createUtcDateTimeForDB({
          selectedDate: "2025-10-28",
          selectedTime: "-1:00",
          selectedTimezone: "Asia/Tokyo",
        }),
      ).toBeNull();
    });

    it("handles empty parameters", () => {
      expect(
        createUtcDateTimeForDB({
          selectedDate: "",
          selectedTime: "10:00",
          selectedTimezone: "Asia/Tokyo",
        }),
      ).toBeNull();
      expect(
        createUtcDateTimeForDB({
          selectedDate: "2025-10-28",
          selectedTime: "",
          selectedTimezone: "Asia/Tokyo",
        }),
      ).toBeNull();
      expect(
        createUtcDateTimeForDB({
          selectedDate: "2025-10-28",
          selectedTime: "10:00",
          selectedTimezone: "",
        }),
      ).toBeNull();
    });

    it("returns null when timezone resolution fails", () => {
      const result = createUtcDateTimeForDB({
        selectedDate: "2025-10-28",
        selectedTime: "10:00",
        selectedTimezone: "Invalid/TZ",
      });
      expect(result).toBeNull();
    });

    it("handles invalid date ranges", () => {
      expect(
        createUtcDateTimeForDB({
          selectedDate: "2025-13-01",
          selectedTime: "10:00",
          selectedTimezone: "Asia/Tokyo",
        }),
      ).toBeNull();
      expect(
        createUtcDateTimeForDB({
          selectedDate: "2025-01-32",
          selectedTime: "10:00",
          selectedTimezone: "Asia/Tokyo",
        }),
      ).toBeNull();
    });
  });

  describe("Boundary value tests", () => {
    it("handles minimum time (00:00)", () => {
      const result = createUtcDateTimeForDB({
        selectedDate: "2025-10-28",
        selectedTime: "00:00",
        selectedTimezone: "Asia/Tokyo",
      });
      expect(result).toMatch(/2025-10-27T\d{2}:00:00\.000Z/);
    });

    it("handles maximum time (23:59)", () => {
      const result = createUtcDateTimeForDB({
        selectedDate: "2025-10-28",
        selectedTime: "23:59",
        selectedTimezone: "Asia/Tokyo",
      });
      expect(result).toMatch(/2025-10-28T\d{2}:59:00\.000Z/);
    });
  });
});
