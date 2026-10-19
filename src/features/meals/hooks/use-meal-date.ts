"use client";

import { parseAsString, useQueryState } from "nuqs";
import { useCurrentMess } from "@/features/messes/mess-context";
import { addDays, todayIn } from "@/lib/date";

/** Members can plan meals up to a week ahead (BUSINESS_RULES §3, planning window). */
export const PLANNING_DAYS = 7;

const isDate = (v: string | null): v is string => !!v && /^\d{4}-\d{2}-\d{2}$/.test(v);

/**
 * The day the meals screen shows, kept in the URL as `?date=2026-10-20` (none = today in the mess
 * timezone). Needs a Suspense boundary (nuqs reads the URL).
 */
export function useMealDate() {
  const mess = useCurrentMess();
  const today = todayIn(mess.timezone);
  const maxDate = addDays(today, PLANNING_DAYS);
  const [param, setParam] = useQueryState("date", parseAsString);

  const date = isDate(param) && param <= maxDate ? param : today;
  const setDate = (next: string) => setParam(next === today ? null : next);

  return { date, today, maxDate, setDate };
}
