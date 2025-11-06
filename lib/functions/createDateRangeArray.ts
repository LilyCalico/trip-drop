import { addDays, format, isAfter, isValid, parseISO } from "date-fns";

/**
 * 開始日と終了日を含む日付の配列を生成する。
 * @param startIso 包含的に含める開始日のISO 8601文字列
 * @param endIso 包含的に含める終了日のISO 8601文字列
 * @returns 開始日から終了日までの日付（`yyyy-MM-dd`形式）の配列
 * @throws {TypeError} startIso/endIsoが未指定またはISO 8601として無効な場合
 * @throws {RangeError} 開始日が終了日より後の場合
 * @returns 開始日から終了日までの日付（`yyyy-MM-dd`形式）の配列
 */
export function createDateRangeArray(
  startIso: string,
  endIso: string,
): string[] {
  if (!startIso || !endIso) {
    throw new TypeError("startIso and endIso are required");
  }

  const start = parseISO(startIso);
  const end = parseISO(endIso);

  if (!isValid(start) || !isValid(end)) {
    throw new TypeError("startIso and endIso must be valid ISO date strings");
  }

  if (isAfter(start, end)) {
    throw new RangeError("startIso must be on or before endIso");
  }

  const days: string[] = [];
  let current = start;

  while (!isAfter(current, end)) {
    days.push(format(current, "yyyy-MM-dd"));
    current = addDays(current, 1);
  }

  return days;
}

export default createDateRangeArray;
