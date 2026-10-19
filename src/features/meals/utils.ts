import type { DayRow, MealDay, MealEntryInput, MealValue } from "./meals-types";

/*
 * Meal counts move in halves and weights in quarters, which floating point represents exactly, so
 * client-side sums here match the server's decimal math.
 */

export const EMPTY_MEAL: MealValue = { quantity: "0", guestQuantity: "0", note: null };

export const mealOf = (row: Pick<DayRow, "meals">, slotId: string) => row.meals[slotId] ?? EMPTY_MEAL;

export const isEating = (meal: MealValue) => Number(meal.quantity) > 0;

const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);

/** Weighted meals of one entry: (own + guests) × slot weight (BUSINESS_RULES §4). */
export const weighted = (meal: MealValue, weight: string) =>
  (Number(meal.quantity) + Number(meal.guestQuantity)) * Number(weight);

/**
 * Applies saved entries to a cached day sheet and recomputes its totals, so an optimistic update
 * shows the same numbers the server will return.
 */
export function applyEntries(day: MealDay, entries: MealEntryInput[]): MealDay {
  const forDay = entries.filter((e) => e.date === day.date);
  if (forDay.length === 0) return day;

  const weightOf = (slotId: string) => day.slots.find((s) => s.id === slotId)?.weight ?? "0";
  const rows = day.rows.map((row) => {
    const changes = forDay.filter((e) => e.memberId === row.member.id);
    if (changes.length === 0) return row;
    const meals = { ...row.meals };
    for (const e of changes) {
      meals[e.slotId] = {
        quantity: String(e.quantity),
        guestQuantity: String(e.guestQuantity),
        note: e.note === undefined ? (meals[e.slotId]?.note ?? null) : e.note,
      };
    }
    const total = sum(Object.entries(meals).map(([slotId, m]) => weighted(m, weightOf(slotId))));
    return { ...row, meals, weightedMeals: String(total) };
  });

  const totals = Object.fromEntries(
    day.slots.map((s) => [
      s.id,
      {
        meals: String(sum(rows.map((r) => Number(mealOf(r, s.id).quantity)))),
        guests: String(sum(rows.map((r) => Number(mealOf(r, s.id).guestQuantity)))),
      },
    ]),
  );
  return { ...day, rows, totals, weightedTotal: String(sum(rows.map((r) => Number(r.weightedMeals)))) };
}

/** "2h 14m", "45m", "under a minute": time left until a cutoff. */
export function formatTimeLeft(ms: number) {
  if (ms < 60_000) return "under a minute";
  const minutes = Math.floor(ms / 60_000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days >= 1) return `${days}d ${hours % 24}h`;
  if (hours >= 1) return `${hours}h ${minutes % 60}m`;
  return `${minutes}m`;
}

/** "12:00 PM"-style label for a `HH:mm` cutoff. */
export function formatTimeOfDay(time: string) {
  const [h, m] = time.split(":").map(Number);
  const suffix = h < 12 ? "AM" : "PM";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${suffix}`;
}

/** "×½", "×1", "×1.5": how much one meal of a slot counts. */
export function formatWeight(weight: string) {
  const w = Number(weight);
  const fractions: Record<number, string> = { 0.25: "¼", 0.5: "½", 0.75: "¾" };
  return `×${fractions[w] ?? String(w)}`;
}
