import { describe, expect, it } from "vitest";
import {
  formatCount,
  formatDate,
  formatDay,
  formatMoney,
  formatSignedMoney,
  initials,
  isNegative,
  isZero,
} from "./format";

describe("formatMoney", () => {
  it("formats decimal strings exactly, with ৳ and lakh grouping", () => {
    expect(formatMoney("1250.5")).toBe("৳1,250.50");
    expect(formatMoney("150000")).toBe("৳1,50,000.00");
    expect(formatMoney("0.1")).toBe("৳0.10");
  });

  it("never shows a sign (direction is shown with words)", () => {
    expect(formatMoney("-500")).toBe("৳500.00");
  });

  it("drops trailing zeros in compact mode", () => {
    expect(formatMoney("1500.00", { compact: true })).toBe("৳1,500");
    expect(formatMoney("1500.5", { compact: true })).toBe("৳1,500.5");
  });

  it("doesn't lose precision on large values", () => {
    expect(formatMoney("12345678901.23")).toBe("৳12,34,56,78,901.23");
  });
});

describe("formatSignedMoney", () => {
  it("keeps the sign for amounts that are plainly negative, like cash in hand", () => {
    expect(formatSignedMoney("-200")).toBe("−৳200.00");
    expect(formatSignedMoney("200")).toBe("৳200.00");
  });
});

describe("isNegative / isZero", () => {
  it.each([
    ["-1.00", true, false],
    ["0.00", false, true],
    ["-0.00", true, true],
    ["12.50", false, false],
  ])("%s", (value, negative, zero) => {
    expect(isNegative(value)).toBe(negative);
    expect(isZero(value)).toBe(zero);
  });
});

describe("formatCount", () => {
  it("drops trailing zeros and caps at 2 decimals", () => {
    expect(formatCount("3.00")).toBe("3");
    expect(formatCount("2.5")).toBe("2.5");
    expect(formatCount("1.255")).toBe("1.26");
  });
});

describe("formatDate / formatDay", () => {
  const now = new Date(2026, 9, 19, 12, 0);

  it("formats calendar days and timestamps", () => {
    expect(formatDate("2026-10-12")).toBe("12 Oct 2026");
    expect(formatDate("not a date")).toBe("");
  });

  it("uses relative words for nearby days", () => {
    expect(formatDay("2026-10-19", now)).toBe("Today");
    expect(formatDay("2026-10-18", now)).toBe("Yesterday");
    expect(formatDay("2026-10-20", now)).toBe("Tomorrow");
    expect(formatDay("2026-10-01", now)).toBe("1 Oct");
    expect(formatDay("2025-12-31", now)).toBe("31 Dec 2025");
  });
});

describe("initials", () => {
  it.each([
    ["Rahim Uddin", "RU"],
    ["karim", "K"],
    ["  Md  Abdul   Karim ", "MK"],
    ["", ""],
  ])("%s → %s", (name, expected) => {
    expect(initials(name)).toBe(expected);
  });
});
