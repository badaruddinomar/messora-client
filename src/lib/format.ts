import { differenceInCalendarDays, format, formatDistanceToNowStrict, isValid, parseISO } from "date-fns";
import type { Money } from "@/types/api";

/*
 * Display formatting (DESIGN_SYSTEM §8). Money arrives as decimal strings and is formatted
 * directly from the string, so it never passes through floating point.
 */

// Lakh/crore grouping (1,50,000) is how amounts are usually written in Bangladesh.
const LOCALE = "en-IN";

const moneyFormat = new Intl.NumberFormat(LOCALE, {
  style: "currency",
  currency: "BDT",
  currencyDisplay: "narrowSymbol",
  signDisplay: "never",
});
const moneyFormatCompact = new Intl.NumberFormat(LOCALE, {
  style: "currency",
  currency: "BDT",
  currencyDisplay: "narrowSymbol",
  signDisplay: "never",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

type Numeric = Money | number;

// Intl accepts decimal strings for exact formatting, but its types only list number | bigint.
const asIntlValue = (value: Numeric) => value as unknown as number;

export const isNegative = (value: Numeric) =>
  typeof value === "number" ? value < 0 : value.trim().startsWith("-");

export const isZero = (value: Numeric) =>
  typeof value === "number" ? value === 0 : /^-?0*(\.0*)?$/.test(value.trim());

/**
 * `৳1,250.50`. The sign is never shown; callers show direction with words and colour
 * ("Due ৳500", not "-৳500"), see `MoneyText`.
 * `compact` drops trailing ".00" for large stat numbers.
 */
export function formatMoney(value: Numeric, { compact = false }: { compact?: boolean } = {}) {
  return (compact ? moneyFormatCompact : moneyFormat).format(asIntlValue(value));
}

/** Money where a negative amount is a plain minus (cash in hand), with a real minus sign: "−৳200.00". */
export const formatSignedMoney = (value: Numeric) => `${isNegative(value) ? "−" : ""}${formatMoney(value)}`;

const countFormat = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 2 });

/** Meal counts and other quantities: up to 2 decimals, trailing zeros dropped (`2.5`, `3`). */
export const formatCount = (value: Numeric) => countFormat.format(asIntlValue(value));

const toDate = (value: string | Date) => (value instanceof Date ? value : parseISO(value));

/** `12 Oct 2026`. Accepts a `YYYY-MM-DD` calendar day or an ISO timestamp. */
export function formatDate(value: string | Date, pattern = "d MMM yyyy") {
  const date = toDate(value);
  return isValid(date) ? format(date, pattern) : "";
}

/** `Today`, `Yesterday`, `Tomorrow`, otherwise `12 Oct 2026`, for lists of recent items. */
export function formatDay(value: string | Date, now: Date = new Date()) {
  const date = toDate(value);
  if (!isValid(date)) return "";
  const diff = differenceInCalendarDays(date, now);
  if (diff === 0) return "Today";
  if (diff === -1) return "Yesterday";
  if (diff === 1) return "Tomorrow";
  return format(date, date.getFullYear() === now.getFullYear() ? "d MMM" : "d MMM yyyy");
}

/** `5 minutes ago`, for chat and notifications. */
export function formatRelative(value: string | Date) {
  const date = toDate(value);
  return isValid(date) ? formatDistanceToNowStrict(date, { addSuffix: true }) : "";
}

/** Initials for avatars: "Rahim Uddin" → "RU". */
export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}
