import { describe, expect, it } from "vitest";
import { bazarDayInsight, categoryInsight, mealRateInsight } from "./insights";
import type { TrendPoint } from "./reports-types";

const point = (month: number, mealRate: string, isFinal = true) =>
  ({ month, year: 2026, mealRate, isFinal }) as TrendPoint;

describe("mealRateInsight", () => {
  it("compares the last month with a meal rate to the one before", () => {
    expect(mealRateInsight([point(8, "50"), point(9, "54")])).toBe("Meal rate is up 8% from August");
    expect(mealRateInsight([point(9, "50"), point(10, "46", false)])).toBe(
      "Meal rate is down 8% from September so far",
    );
  });

  it("skips months without meals and handles too little data", () => {
    expect(mealRateInsight([point(8, "50"), point(9, "0"), point(10, "50")])).toBe(
      "Meal rate is steady at ৳50.00",
    );
    expect(mealRateInsight([point(10, "52.5", false)])).toBe("Meal rate is ৳52.50 in October so far");
    expect(mealRateInsight([point(10, "0")])).toBe("Meal rate by month");
  });
});

describe("categoryInsight / bazarDayInsight", () => {
  it("names the biggest category and the busiest day", () => {
    expect(
      categoryInsight([
        { category: "HOUSE_RENT", total: "6000.00", count: 1 },
        { category: "GAS", total: "2000.00", count: 1 },
      ]),
    ).toBe("House rent is 75% of shared costs");
    expect(categoryInsight([{ category: "GAS", total: "900.00", count: 1 }])).toBe(
      "All shared costs were gas",
    );
    expect(
      bazarDayInsight([
        { date: "2026-10-02", total: "300.00", count: 1 },
        { date: "2026-10-05", total: "1200.00", count: 2 },
      ]),
    ).toBe("Most bazar on 5 Oct: ৳1,200.00");
    expect(bazarDayInsight([{ date: "2026-10-02", total: "0.00", count: 0 }])).toBe("Bazar by day");
  });
});
