import { describe, expect, it } from "vitest";
import { addDays, datesBetween, todayIn, weekdayIndex } from "./date";

describe("date helpers", () => {
  it("uses the mess timezone for today", () => {
    // 20:00 UTC on Oct 31 is already Nov 1 in Dhaka (UTC+6).
    const now = new Date("2026-10-31T20:00:00Z");
    expect(todayIn("Asia/Dhaka", now)).toBe("2026-11-01");
    expect(todayIn("UTC", now)).toBe("2026-10-31");
  });

  it("adds days across month and year ends", () => {
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
    expect(addDays("2027-01-01", -1)).toBe("2026-12-31");
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
  });

  it("lists days inclusively and finds the weekday (Monday first)", () => {
    expect(datesBetween("2026-10-30", "2026-11-02")).toEqual([
      "2026-10-30",
      "2026-10-31",
      "2026-11-01",
      "2026-11-02",
    ]);
    expect(datesBetween("2026-10-02", "2026-10-01")).toEqual([]);
    expect(weekdayIndex("2026-10-19")).toBe(0); // a Monday
    expect(weekdayIndex("2026-10-25")).toBe(6); // a Sunday
  });
});
