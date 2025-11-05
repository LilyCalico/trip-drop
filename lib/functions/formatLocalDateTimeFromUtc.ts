/**
 * 指定されたUTC日時文字列をタイムゾーンで変換し、現地日付時刻(MM/DD HH:MM)を返す
 * @param datetimeUtc UTCのISO8601日時文字列
 * @param timezone IANAタイムゾーン名 (例: "Europe/Stockholm")
 * @returns MM/DD HH:MM形式の文字列。変換できない場合は null
 */
export const formatLocalDateTimeFromUtc = (
  datetimeUtc: string,
  timezone: string,
): string | null => {
  if (!datetimeUtc || !timezone) {
    console.warn("formatLocalDateTimeFromUtc: Missing parameters", {
      datetimeUtc,
      timezone,
    });
    return null;
  }

  const utcDate = new Date(datetimeUtc);

  if (Number.isNaN(utcDate.getTime())) {
    console.warn("formatLocalDateTimeFromUtc: Invalid UTC datetime", {
      datetimeUtc,
    });
    return null;
  }

  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: timezone,
    });

    const parts = formatter.formatToParts(utcDate);
    const valueByType = parts.reduce<Record<string, string>>((acc, part) => {
      if (part.type !== "literal") {
        acc[part.type] = part.value;
      }
      return acc;
    }, {});

    const month = valueByType.month;
    const day = valueByType.day;
    const hour = valueByType.hour;
    const minute = valueByType.minute;

    if (!month || !day || !hour || !minute) {
      console.warn("formatLocalDateTimeFromUtc: Missing formatted parts", {
        datetimeUtc,
        timezone,
        parts,
      });
      return null;
    }

    return `${month}/${day} ${hour}:${minute}`;
  } catch (error) {
    console.warn("formatLocalDateTimeFromUtc: Failed to format", {
      datetimeUtc,
      timezone,
      error,
    });
    return null;
  }
};


