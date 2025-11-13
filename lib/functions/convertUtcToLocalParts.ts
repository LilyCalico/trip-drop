export interface LocalDateTimeParts {
  date: string;
  time: string;
}

export const extractLocalDateTimeParts = ({
  datetimeUtc,
  timezone,
}: {
  datetimeUtc: string | null | undefined;
  timezone: string | null | undefined;
}): LocalDateTimeParts | null => {
  if (!datetimeUtc || !timezone) {
    return null;
  }

  try {
    const date = new Date(datetimeUtc);
    if (Number.isNaN(date.getTime())) {
      return null;
    }

    const dateFormatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });

    const timeFormatter = new Intl.DateTimeFormat("en-GB", {
      timeZone: timezone,
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
    });

    const formattedDate = dateFormatter
      .format(date)
      .replaceAll("/", "-") // en-CA returns YYYY-MM-DD but keep safety
      .trim();

    const formattedTime = timeFormatter.format(date).trim();

    return {
      date: formattedDate,
      time: formattedTime,
    };
  } catch (error) {
    console.error("Failed to extract local datetime parts:", error);
    return null;
  }
};


