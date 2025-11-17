/**
 * 指定されたUTC日時文字列をタイムゾーンで変換し、現地日付(YYYY-MM-DD)を返す
 * @param datetimeUtc UTCのISO8601日時文字列
 * @param timezone IANAタイムゾーン名 (例: "Europe/Stockholm")
 * @returns YYYY-MM-DD形式の文字列。変換できない場合は null
 */
export const formatLocalDateFromUtc = (
  datetimeUtc: string,
  timezone: string,
): string | null => {
  if (!datetimeUtc || !timezone) {
    console.warn("formatLocalDateFromUtc: Missing parameters", {
      datetimeUtc,
      timezone,
    });
    return null;
  }

  const utcDate = new Date(datetimeUtc);

  if (Number.isNaN(utcDate.getTime())) {
    console.warn("formatLocalDateFromUtc: Invalid UTC datetime", {
      datetimeUtc,
    });
    return null;
  }

  try {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone: timezone,
    });

    return formatter.format(utcDate);
  } catch (error) {
    console.warn("formatLocalDateFromUtc: Failed to format", {
      datetimeUtc,
      timezone,
      error,
    });
    return null;
  }
};


