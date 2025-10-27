const MINUTE_MS = 60_000;
const MAX_OFFSET_HOURS = 14;

interface ZonedDateParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

const parseDateString = (value: string): [number, number, number] | null => {
  const parts = value.split("-").map(Number);

  if (parts.length !== 3 || parts.some((part) => Number.isNaN(part))) {
    return null;
  }

  const [year, month, day] = parts;

  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }

  return [year, month, day];
};

const parseTimeString = (value: string): [number, number] | null => {
  const parts = value.split(":").map(Number);

  if (parts.length !== 2 || parts.some((part) => Number.isNaN(part))) {
    return null;
  }

  const [hour, minute] = parts;

  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return null;
  }

  return [hour, minute];
};

const createFormatter = (timeZone: string) => {
  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour12: false,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch (error) {
    console.warn("createUtcDateTimeForDB: Invalid timezone", timeZone, error);
    return null;
  }
};

const extractParts = (
  formatter: Intl.DateTimeFormat | null,
  timestamp: number,
): ZonedDateParts | null => {
  if (!formatter) {
    return null;
  }

  try {
    const parts = formatter.formatToParts(new Date(timestamp));

    const getValue = (type: Intl.DateTimeFormatPartTypes) =>
      parts.find((part) => part.type === type)?.value;

    const year = Number(getValue("year"));
    const month = Number(getValue("month"));
    const day = Number(getValue("day"));
    const hour = Number(getValue("hour"));
    const minute = Number(getValue("minute"));
    const second = Number(getValue("second"));

    if (
      [year, month, day, hour, minute, second].some((value) =>
        Number.isNaN(value),
      )
    ) {
      return null;
    }

    return { year, month, day, hour, minute, second };
  } catch (error) {
    console.warn("createUtcDateTimeForDB: Failed to extract parts", error);
    return null;
  }
};

const toComparableValue = ({
  year,
  month,
  day,
  hour,
  minute,
  second,
}: ZonedDateParts) => Date.UTC(year, month - 1, day, hour, minute, second);

export const createUtcDateTimeForDB = (
  selectedDate: string,
  selectedTime: string,
  selectedTimezone: string,
): string | null => {
  if (!selectedDate || !selectedTime || !selectedTimezone) {
    console.warn("createUtcDateTimeForDB: Missing required parameters", {
      selectedDate,
      selectedTime,
      selectedTimezone,
    });
    return null;
  }

  const parsedDate = parseDateString(selectedDate);
  const parsedTime = parseTimeString(selectedTime);

  if (!parsedDate || !parsedTime) {
    console.warn("createUtcDateTimeForDB: Invalid date/time string", {
      selectedDate,
      selectedTime,
    });
    return null;
  }

  const [year, month, day] = parsedDate;
  const [hour, minute] = parsedTime;

  // Create a local date string in the target timezone
  const localDateTimeString = `${selectedDate}T${selectedTime}:00`;

  try {
    // Create a date object assuming the local time is in the target timezone
    const localDate = new Date(localDateTimeString);

    if (Number.isNaN(localDate.getTime())) {
      console.warn("createUtcDateTimeForDB: Invalid date created", {
        localDateTimeString,
      });
      return null;
    }

    // Use Intl.DateTimeFormat to get the offset for this specific date/time
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: selectedTimezone,
      timeZoneName: "longOffset",
    });

    const parts = formatter.formatToParts(localDate);
    const offsetPart = parts.find((part) => part.type === "timeZoneName");

    if (!offsetPart?.value) {
      console.warn(
        "createUtcDateTimeForDB: Could not determine timezone offset",
        {
          selectedTimezone,
          localDate,
        },
      );
      return null;
    }

    let offsetString = offsetPart.value
      .replace("GMT", "")
      .replace("UTC", "")
      .trim();

    // Ensure offset is in proper format
    if (!/^[+-]\d{2}:\d{2}$/.test(offsetString)) {
      console.warn("createUtcDateTimeForDB: Invalid offset format", {
        offsetString,
        selectedTimezone,
      });
      return null;
    }

    // Create the full ISO string with timezone offset
    const zonedIsoString = `${localDateTimeString}${offsetString}`;

    // Convert to UTC
    const utcDate = new Date(zonedIsoString);

    if (Number.isNaN(utcDate.getTime())) {
      console.warn("createUtcDateTimeForDB: Failed to create UTC date", {
        zonedIsoString,
      });
      return null;
    }

    return utcDate.toISOString();
  } catch (error) {
    console.warn("createUtcDateTimeForDB: Error during conversion", error);
    return null;
  }
};
