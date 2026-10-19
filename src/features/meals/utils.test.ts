import { describe, expect, it } from "vitest";
import type { MealDay } from "./meals-types";
import { applyEntries, formatTimeLeft, formatTimeOfDay, formatWeight } from "./utils";

const slot = (id: string, weight: string) => ({
  id,
  name: id,
  weight,
  cutoffTime: null,
  sortOrder: 0,
  isActive: true,
  cutoffAt: "2026-10-19T00:00:00Z",
  isPastCutoff: false,
  canEditOwn: true,
  menu: null,
});
const meal = (quantity: string, guestQuantity = "0") => ({ quantity, guestQuantity, note: null });
const member = (id: string) => ({ id, name: id, avatarUrl: null, isYou: false });

const day: MealDay = {
  date: "2026-10-19",
  month: { id: "m", year: 2026, month: 10, status: "OPEN" },
  editable: true,
  canEditOthers: true,
  allowGuestMeal: true,
  you: { memberId: "a", defaultMealOn: true },
  slots: [slot("breakfast", "0.5"), slot("lunch", "1")],
  rows: [
    { member: member("a"), meals: { breakfast: meal("1"), lunch: meal("1") }, weightedMeals: "1.5" },
    { member: member("b"), meals: { breakfast: meal("1"), lunch: meal("1") }, weightedMeals: "1.5" },
  ],
  totals: { breakfast: { meals: "2", guests: "0" }, lunch: { meals: "2", guests: "0" } },
  weightedTotal: "3",
};

describe("applyEntries", () => {
  it("updates the member's meals and recomputes every total", () => {
    const next = applyEntries(day, [
      { memberId: "a", slotId: "lunch", date: "2026-10-19", quantity: 0, guestQuantity: 2 },
      { memberId: "b", slotId: "breakfast", date: "2026-10-19", quantity: 0, guestQuantity: 0 },
    ]);
    expect(next.rows[0].meals.lunch).toEqual({ quantity: "0", guestQuantity: "2", note: null });
    expect(next.rows[0].weightedMeals).toBe("2.5"); // ½ breakfast + 2 guest lunches
    expect(next.rows[1].weightedMeals).toBe("1");
    expect(next.totals).toEqual({
      breakfast: { meals: "1", guests: "0" },
      lunch: { meals: "1", guests: "2" },
    });
    expect(next.weightedTotal).toBe("3.5");
  });

  it("adds meals that weren't recorded yet and ignores other days", () => {
    const empty = { ...day, rows: [{ ...day.rows[0], meals: {}, weightedMeals: "0" }] };
    const next = applyEntries(empty, [
      { memberId: "a", slotId: "lunch", date: "2026-10-19", quantity: 1, guestQuantity: 0 },
    ]);
    expect(next.rows[0].weightedMeals).toBe("1");
    expect(
      applyEntries(day, [
        { memberId: "a", slotId: "lunch", date: "2026-10-20", quantity: 0, guestQuantity: 0 },
      ]),
    ).toBe(day);
  });
});

describe("formatting", () => {
  it("formats time left, times of day and weights", () => {
    expect(formatTimeLeft(30_000)).toBe("under a minute");
    expect(formatTimeLeft(45 * 60_000)).toBe("45m");
    expect(formatTimeLeft((2 * 60 + 14) * 60_000)).toBe("2h 14m");
    expect(formatTimeLeft(26 * 3_600_000)).toBe("1d 2h");
    expect(formatTimeOfDay("07:00")).toBe("7:00 AM");
    expect(formatTimeOfDay("17:30")).toBe("5:30 PM");
    expect(formatTimeOfDay("00:00")).toBe("12:00 AM");
    expect(formatWeight("0.50")).toBe("×½");
    expect(formatWeight("1.00")).toBe("×1");
    expect(formatWeight("1.5")).toBe("×1.5");
  });
});
