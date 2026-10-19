import { describe, expect, it } from "vitest";
import { describeBillingMonth, formatStartDay, joinLink, ordinal } from "./utils";

describe("ordinal", () => {
  it.each([
    [1, "1st"],
    [2, "2nd"],
    [3, "3rd"],
    [4, "4th"],
    [11, "11th"],
    [12, "12th"],
    [13, "13th"],
    [21, "21st"],
    [22, "22nd"],
    [28, "28th"],
  ])("%i → %s", (n, expected) => {
    expect(ordinal(n)).toBe(expected);
  });
});

describe("billing month copy", () => {
  it("describes the cycle for any start day", () => {
    expect(formatStartDay(5)).toBe("5th of the month");
    expect(describeBillingMonth(1)).toBe("Runs from the 1st to the last day of each month");
    expect(describeBillingMonth(5)).toBe("Runs from the 5th to the 4th of the next month");
  });
});

describe("joinLink", () => {
  it("builds a shareable join link", () => {
    expect(joinLink("https://messora.app", "ABCD2345")).toBe("https://messora.app/join?code=ABCD2345");
  });
});
