interface CreateUtcDateTimeParams {
  selectedDate: string;
  selectedTime?: string;
  selectedTimezone: string;
}

interface DateParts {
  year: number;
  month: number;
  day: number;
}

interface TimeParts {
  hour: number;
  minute: number;
}

/**
 * 日付文字列を解析して年月日を取得
 * @param value YYYY-MM-DD形式の文字列
 * @returns [年, 月, 日] または null
 */
const parseDateString = (value: string): DateParts | null => {
  const parts = value.split("-").map(Number);

  // 日付がYYYY-MM-DD形式であることを確認
  if (parts.length !== 3 || parts.some((part) => Number.isNaN(part))) {
    return null;
  }

  const [year, month, day] = parts;

  // 月が1から12の間であることを確認
  // 日が1から31の間であることを確認
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }

  return { year, month, day };
};

/**
 * 時刻文字列を解析して時分を取得
 * @param value HH:MM形式の文字列
 * @returns {時, 分} または null
 */
const parseTimeString = (value: string): TimeParts | null => {
  const parts = value.split(":").map(Number);

  if (parts.length !== 2 || parts.some((part) => Number.isNaN(part))) {
    return null;
  }

  const [hour, minute] = parts;

  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return null;
  }

  return { hour, minute };
};

/**
 * 選択された日付、時刻、タイムゾーンからUTC ISO文字列を生成
 * @param selectedDate YYYY-MM-DD形式の日付文字列
 * @param selectedTime HH:MM形式の時刻文字列
 * @param selectedTimezone タイムゾーン文字列
 * @returns UTC ISO文字列 または null
 */
export const createUtcDateTimeForDB = ({
  selectedDate,
  selectedTime = "00:00",
  selectedTimezone,
}: CreateUtcDateTimeParams): string | null => {
  // 日付・時刻が存在するものかを確認
  const parsedDate = parseDateString(selectedDate);
  const parsedTime = parseTimeString(selectedTime);

  if (!parsedDate || !parsedTime) {
    console.warn("createUtcDateTimeForDB: Invalid date/time string", {
      selectedDate,
      selectedTime,
    });
    return null;
  }

  // ローカル日時文字列を作成 例: 2025-10-28T22:00:00
  const localDateTimeString = `${selectedDate}T${selectedTime}:00`;

  try {
    // 例:
    const localDate = new Date(localDateTimeString);

    // タイムゾーンオフセットを取得
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: selectedTimezone,
      timeZoneName: "longOffset",
    });

    const parts = formatter.formatToParts(localDate);

    // 例: {type: "timeZoneName", value: "+02:00"}
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

    // 例: "+02:00"
    const offsetString = offsetPart.value
      .replace("GMT", "")
      .replace("UTC", "")
      .trim();

    // オフセット形式を検証
    if (!/^[+-]\d{2}:\d{2}$/.test(offsetString)) {
      console.warn("createUtcDateTimeForDB: Invalid offset format", {
        offsetString,
        selectedTimezone,
      });
      return null;
    }

    // タイムゾーン付きISO文字列を作成してUTCに変換
    // 例: 2025-10-28T22:00:00+02:00
    const zonedIsoString = `${localDateTimeString}${offsetString}`;
    // 例: 2025-10-28T20:00:00.000Z
    const utcDate = new Date(zonedIsoString);

    if (Number.isNaN(utcDate.getTime())) {
      console.warn("createUtcDateTimeForDB: Failed to create UTC date", {
        zonedIsoString,
      });
      return null;
    }

    return utcDate.toISOString();
  } catch (error) {
    console.warn("createUtcDateTimeForDB: Error during conversion", {
      localDateTimeString,
      selectedTimezone,
      error,
    });
    return null;
  }
};
