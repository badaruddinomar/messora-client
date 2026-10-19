import { differenceInCalendarDays, format, parseISO } from "date-fns";
import type { Month } from "./months-types";

/** "October 2026" */
export const monthLabel = (m: Pick<Month, "year" | "month">) =>
  format(new Date(m.year, m.month - 1, 1), "MMMM yyyy");

/** URL key for a month: "2026-10" (used in `?month=`). */
export const monthKey = (m: Pick<Month, "year" | "month">) => `${m.year}-${String(m.month).padStart(2, "0")}`;

/** "1 Oct – 31 Oct", or with years when the month crosses one: "5 Dec 2026 – 4 Jan 2027" */
export function formatPeriod(m: Pick<Month, "startDate" | "endDate">) {
  const start = parseISO(m.startDate);
  const end = parseISO(m.endDate);
  const sameYear = start.getFullYear() === end.getFullYear();
  return sameYear
    ? `${format(start, "d MMM")} – ${format(end, "d MMM")}`
    : `${format(start, "d MMM yyyy")} – ${format(end, "d MMM yyyy")}`;
}

/** Days left in a month including today (0 once it has ended). */
export function daysLeft(m: Pick<Month, "endDate">, today: Date = new Date()) {
  return Math.max(0, differenceInCalendarDays(parseISO(m.endDate), today) + 1);
}

/** How far through the month we are, 0–1, for a progress bar. */
export function monthProgress(m: Pick<Month, "startDate" | "endDate">, today: Date = new Date()) {
  const total = differenceInCalendarDays(parseISO(m.endDate), parseISO(m.startDate)) + 1;
  const done = differenceInCalendarDays(today, parseISO(m.startDate)) + 1;
  return Math.min(1, Math.max(0, done / total));
}

/** Only OPEN months accept changes (BUSINESS_RULES §3). */
export const isMonthEditable = (m: Pick<Month, "status">) => m.status === "OPEN";
