/**
 * 指定されたタイムゾーンでのISO文字列を作成
 * @param visitDate - 訪問日（YYYY-MM-DD形式）
 * @param time - 訪問時間（HH:MM形式）
 * @param timezone - タイムゾーン（例: "Europe/Stockholm"）
 * @returns タイムゾーン情報付きのISO文字列（例: "2025-10-09T03:00:00+02:00"）
 */
export const toZonedIsoString = (
  visitDate: string,
  time: string,
  timezone: string,
): string | null => {
  try {
    // 現地時間として日時文字列を直接作成
    const localDateTimeString = `${visitDate}T${time}:00`;

    // 日時の妥当性チェックのためにDateオブジェクトを作成
    const testDate = new Date(localDateTimeString);
    if (Number.isNaN(testDate.getTime())) {
      console.warn("Invalid date created:", localDateTimeString);
      return null;
    }

    // タイムゾーンでのオフセットを取得（指定された日時で）
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      timeZoneName: "longOffset",
    });

    const parts = formatter.formatToParts(testDate);
    const offsetPart = parts.find((part) => part.type === "timeZoneName");
    let offsetString = offsetPart ? offsetPart.value : "+00:00";

    // GMT形式をISO形式に変換
    if (offsetString.includes("GMT")) {
      offsetString = offsetString.replace("GMT", "");
    }

    // 完全なISO文字列を作成
    const visitDateTimeWithTimezone = `${localDateTimeString}${offsetString}`;

    return visitDateTimeWithTimezone;
  } catch (error) {
    console.error("Error creating zoned ISO string:", error);
    return null;
  }
};
