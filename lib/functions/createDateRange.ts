import { addDays, format, isAfter, isValid, parseISO } from "date-fns";

export function createDateRange(startIso: string, endIso: string): string[] {
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

export default createDateRange;
