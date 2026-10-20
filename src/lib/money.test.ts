import { describe, expect, it } from "vitest";
import { isMoney, subtractMoney, sumMoney } from "./money";

describe("money", () => {
  it("adds decimal strings exactly", () => {
    expect(sumMoney(["0.10", "0.20"])).toBe("0.30");
    expect(sumMoney(["350.5", "144", "0.05"])).toBe("494.55");
    expect(sumMoney([])).toBe("0.00");
    expect(sumMoney(["12", "", undefined, "abc", "1.234"])).toBe("12.00");
  });

  it("validates amounts", () => {
    expect(isMoney("1250")).toBe(true);
    expect(isMoney("1250.5")).toBe(true);
    expect(isMoney("1250.50")).toBe(true);
    expect(isMoney("1250.")).toBe(false);
    expect(isMoney("1.234")).toBe(false);
    expect(isMoney("-5")).toBe(false);
    expect(isMoney("")).toBe(false);
  });
});

describe("subtractMoney", () => {
  it("subtracts exactly, going negative when needed", () => {
    expect(subtractMoney("1000", "333.33")).toBe("666.67");
    expect(subtractMoney("0.3", "0.1")).toBe("0.20");
    expect(subtractMoney("100", "150.5")).toBe("-50.50");
    expect(subtractMoney("", "5")).toBe("-5.00");
  });
});
