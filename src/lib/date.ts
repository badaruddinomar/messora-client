/*
 * Calendar days as `YYYY-MM-DD` strings, the API's date format. Days are counted in the mess
 * timezone (not the browser's), so "today" matches the server's cutoffs.
 */

export type DateString = string;

/** Today's date in a timezone, e.g. `todayIn("Asia/Dhaka")` → `2026-10-19`. */
export function todayIn(timeZone: string, now: Date = new Date()): DateString {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** `addDays("2026-10-31", 1)` → `2026-11-01`. Pure calendar arithmetic, no timezone involved. */
export function addDays(date: DateString, days: number): DateString {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Every day from `from` to `to`, inclusive. */
export function datesBetween(from: DateString, to: DateString): DateString[] {
  const days: DateString[] = [];
  for (let day = from; day <= to; day = addDays(day, 1)) days.push(day);
  return days;
}

/** Monday = 0 … Sunday = 6, for laying out calendar grids that start on Monday. */
export const weekdayIndex = (date: DateString) => (new Date(`${date}T00:00:00Z`).getUTCDay() + 6) % 7;
