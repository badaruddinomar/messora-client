import type { Money } from "@/types/api";

/*
 * Exact arithmetic on decimal money strings ("350.50"), done in whole paisa with BigInt so a running
 * total never drifts the way floating point does (0.1 + 0.2). Display formatting lives in format.ts.
 */

const MONEY = /^\d+(\.\d{0,2})?$/;

/** Whether a string is a valid amount with at most two decimals ("", "12.", "1.234" are not). */
export const isMoney = (value: string) => MONEY.test(value.trim()) && !value.trim().endsWith(".");

// BigInt() rather than 0n literals: the TypeScript target predates them.
const ZERO = BigInt(0);
const HUNDRED = BigInt(100);

const toPaisa = (value: string) => {
  const [whole, fraction = ""] = value.trim().split(".");
  return BigInt(whole) * HUNDRED + BigInt(fraction.padEnd(2, "0"));
};

const fromPaisa = (paisa: bigint) => {
  const sign = paisa < ZERO ? "-" : "";
  const abs = paisa < ZERO ? -paisa : paisa;
  return `${sign}${abs / HUNDRED}.${String(abs % HUNDRED).padStart(2, "0")}`;
};

/** Sum of amounts; anything that isn't a valid amount (an empty field) counts as 0. */
export const sumMoney = (values: (Money | undefined)[]) =>
  fromPaisa(values.reduce((total, v) => total + (v && isMoney(v) ? toPaisa(v) : ZERO), ZERO));
