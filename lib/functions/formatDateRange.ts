import { formatLocalDateFromUtc } from "@/lib/functions/formatLocalDateFromUtc";

interface FormatDateRangeParams {
  startAt: string | null | undefined;
  endAt: string | null | undefined;
  timeZone: string | null | undefined;
}

const toMonthDayLabel = (dateString: string): string | null => {
  const [year, month, day] = dateString.split("-");
  const yearNum = Number(year);
  const monthNum = Number(month);
  const dayNum = Number(day);

  if (Number.isNaN(yearNum) || Number.isNaN(monthNum) || Number.isNaN(dayNum)) {
    console.warn("formatDateRange: Invalid local date parts", {
      dateString,
    });
    return null;
  }

  const date = new Date(Date.UTC(yearNum, monthNum - 1, dayNum));

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
};

/**
 * UTC開始/終了日時を現地タイムゾーン日に変換し "Dec 1 - Dec 31" 形式で返す
 */
export const formatDateRange = ({
  startAt,
  endAt,
  timeZone,
}: FormatDateRangeParams): string | null => {
  if (!startAt || !endAt || !timeZone) {
    console.warn("formatDateRange: Missing parameters", {
      startAt,
      endAt,
      timeZone,
    });
    return null;
  }

  const startLocalDate = formatLocalDateFromUtc(startAt, timeZone);
  const endLocalDate = formatLocalDateFromUtc(endAt, timeZone);

  if (!startLocalDate || !endLocalDate) {
    console.warn("formatDateRange: Failed to convert to local dates", {
      startAt,
      endAt,
      timeZone,
    });
    return null;
  }

  const startLabel = toMonthDayLabel(startLocalDate);
  const endLabel = toMonthDayLabel(endLocalDate);

  if (!startLabel || !endLabel) {
    console.warn("formatDateRange: Failed to format labels", {
      startLocalDate,
      endLocalDate,
    });
    return null;
  }

  if (startLabel === endLabel) {
    return startLabel;
  }

  return `${startLabel} - ${endLabel}`;
};
