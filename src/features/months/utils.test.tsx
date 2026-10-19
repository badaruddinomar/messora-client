import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MonthStatusBadge } from "./components/month-status-badge";
import { daysLeft, formatPeriod, isMonthEditable, monthKey, monthLabel, monthProgress } from "./utils";

const october = { year: 2026, month: 10, startDate: "2026-10-01", endDate: "2026-10-31" };

describe("labels", () => {
  it("names months and builds URL keys", () => {
    expect(monthLabel(october)).toBe("October 2026");
    expect(monthKey(october)).toBe("2026-10");
    expect(monthKey({ year: 2027, month: 1 })).toBe("2027-01");
  });

  it("formats periods, adding years only when they differ", () => {
    expect(formatPeriod(october)).toBe("1 Oct – 31 Oct");
    expect(formatPeriod({ startDate: "2026-12-05", endDate: "2027-01-04" })).toBe("5 Dec 2026 – 4 Jan 2027");
  });
});

describe("progress", () => {
  const today = new Date(2026, 9, 19);

  it("counts days left including today", () => {
    expect(daysLeft(october, today)).toBe(13);
    expect(daysLeft(october, new Date(2026, 9, 31))).toBe(1);
    expect(daysLeft(october, new Date(2026, 10, 3))).toBe(0);
  });

  it("is between 0 and 1", () => {
    expect(monthProgress(october, new Date(2026, 9, 1))).toBeCloseTo(1 / 31);
    expect(monthProgress(october, new Date(2026, 9, 31))).toBe(1);
    expect(monthProgress(october, new Date(2027, 0, 1))).toBe(1);
    expect(monthProgress(october, new Date(2026, 8, 1))).toBe(0);
  });
});

describe("editing", () => {
  it("only allows OPEN months", () => {
    expect(isMonthEditable({ status: "OPEN" })).toBe(true);
    expect(isMonthEditable({ status: "CLOSING" })).toBe(false);
    expect(isMonthEditable({ status: "CLOSED" })).toBe(false);
  });
});

describe("MonthStatusBadge", () => {
  it.each([
    [{ status: "OPEN", hasEnded: false }, "Open"],
    [{ status: "OPEN", hasEnded: true }, "Waiting to close"],
    [{ status: "CLOSING", hasEnded: true }, "Closing"],
    [{ status: "CLOSED", hasEnded: true }, "Closed"],
  ] as const)("%o reads %s", (month, label) => {
    render(<MonthStatusBadge month={month} />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });
});
