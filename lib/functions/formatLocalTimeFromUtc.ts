/**
 * 指定されたUTC日時文字列をタイムゾーンで変換し、現地時刻(HH:MM)を返す
 * @param datetimeUtc UTCのISO8601日時文字列
 * @param timezone IANAタイムゾーン名 (例: "Europe/Stockholm")
 * @returns HH:MM形式の文字列。変換できない場合は null
 */
export const formatLocalTimeFromUtc = (
  datetimeUtc: string,
  timezone: string,
): string | null => {
  if (!datetimeUtc || !timezone) {
    console.warn("formatLocalTimeFromUtc: Missing parameters", {
      datetimeUtc,
      timezone,
    });
    return null;
  }

  const utcDate = new Date(datetimeUtc);

  if (Number.isNaN(utcDate.getTime())) {
    console.warn("formatLocalTimeFromUtc: Invalid UTC datetime", {
      datetimeUtc,
    });
    return null;
  }

  try {
    const formatter = new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: timezone,
    });

    return formatter.format(utcDate);
  } catch (error) {
    console.warn("formatLocalTimeFromUtc: Failed to format", {
      datetimeUtc,
      timezone,
      error,
    });
    return null;
  }
};
