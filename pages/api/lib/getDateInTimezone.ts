const extractIsoDatePart = (
  value: string | null | undefined,
): string | null => {
  if (!value || typeof value !== "string") {
    return null;
  }
  const match = value.match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : null;
};

export const getDateInTimezone = (
  value: string | null | undefined,
  timezone: string,
): string | null => {
  if (!value) {
    return null;
  }

  const directDate = extractIsoDatePart(value);

  if (!value.includes("T")) {
    return directDate;
  }

  try {
    const targetDate = new Date(value);
    if (Number.isNaN(targetDate.getTime())) {
      return directDate;
    }

    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });

    const formattedDate = formatter.format(targetDate);
    return /^\d{4}-\d{2}-\d{2}$/.test(formattedDate)
      ? formattedDate
      : directDate;
  } catch (error) {
    console.warn("Failed to format date in timezone", {
      value,
      timezone,
      error,
    });
    return directDate;
  }
};
