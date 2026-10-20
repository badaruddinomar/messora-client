import { format } from "date-fns";
import { CATEGORY_LABELS } from "@/features/expenses/expenses-types";
import { formatMoney } from "@/lib/format";
import type { MonthReport, TrendPoint } from "./reports-types";

const monthName = (p: Pick<TrendPoint, "year" | "month">) => format(new Date(p.year, p.month - 1, 1), "MMMM");

/** Months with no meals have no meal rate; they're gaps, not zeros. */
export const hasRate = (p: TrendPoint) => Number(p.mealRate) > 0;

/** "Meal rate is down 8% from September" (DESIGN_SYSTEM §9: the title is the insight). */
export function mealRateInsight(points: TrendPoint[]) {
  const rated = points.filter(hasRate);
  const last = rated.at(-1);
  const prev = rated.at(-2);
  if (!last) return "Meal rate by month";
  const rate = formatMoney(last.mealRate);
  if (!prev) return `Meal rate is ${rate} in ${monthName(last)}${last.isFinal ? "" : " so far"}`;
  const change = (Number(last.mealRate) - Number(prev.mealRate)) / Number(prev.mealRate);
  const pct = Math.round(Math.abs(change) * 100);
  const sofar = last.isFinal ? "" : " so far";
  if (pct === 0) return `Meal rate is steady at ${rate}${sofar}`;
  return `Meal rate is ${change > 0 ? "up" : "down"} ${pct}% from ${monthName(prev)}${sofar}`;
}

export function categoryInsight(rows: MonthReport["expensesByCategory"]) {
  const total = rows.reduce((t, r) => t + Number(r.total), 0);
  const top = rows[0];
  if (!top || total === 0) return "Shared costs by category";
  if (rows.length === 1) return `All shared costs were ${CATEGORY_LABELS[top.category].toLowerCase()}`;
  const share = Math.round((Number(top.total) / total) * 100);
  return `${CATEGORY_LABELS[top.category]} is ${share}% of shared costs`;
}

export function bazarDayInsight(days: MonthReport["bazarByDay"]) {
  const shopped = days.filter((d) => Number(d.total) > 0);
  if (shopped.length === 0) return "Bazar by day";
  const top = shopped.reduce((a, b) => (Number(b.total) > Number(a.total) ? b : a));
  return `Most bazar on ${format(new Date(`${top.date}T00:00:00`), "d MMM")}: ${formatMoney(top.total)}`;
}
