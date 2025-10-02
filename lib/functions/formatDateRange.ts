import { format, isSameMonth, isSameYear, parseISO } from "date-fns";

export interface DateRangeFormatOptions {
  includeYearAlways?: boolean;
}

/**
 * Format ISO8601 start/end into compact human string.
 * Examples:
 *  - same month/year:  May 1 - May 12 2025
 *  - same year diff month: May 28 - Jun 3 2025
 *  - diff year: Dec 30 2025 - Jan 3 2026
 */
export function formatDateRange(
  startIso: string,
  endIso: string,
  options?: DateRangeFormatOptions
): string {
  const start = parseISO(startIso);
  const end = parseISO(endIso);

  const sameYear = isSameYear(start, end);
  const sameMonth = sameYear && isSameMonth(start, end);

  // Force include year on right side; optionally include on left via option
  const right = format(end, sameYear ? "MMM d yyyy" : "MMM d yyyy");

  if (sameMonth) {
    const left = format(
      start,
      options?.includeYearAlways ? "MMM d yyyy" : "MMM d"
    );
    return `${left} - ${right}`;
  }

  if (sameYear) {
    const left = format(
      start,
      options?.includeYearAlways ? "MMM d yyyy" : "MMM d"
    );
    return `${left} - ${right}`;
  }

  const left = format(start, "MMM d yyyy");
  return `${left} - ${right}`;
}

export default formatDateRange;
