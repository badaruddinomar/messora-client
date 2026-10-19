import type { MessGender, MessRole } from "./messes-types";

export const ROLE_LABELS: Record<MessRole, string> = {
  ADMIN: "Admin",
  MANAGER: "Manager",
  MEMBER: "Member",
};

export const GENDER_LABELS: Record<MessGender, string> = {
  MALE: "Boys' mess",
  FEMALE: "Girls' mess",
  MIXED: "Mixed",
};

/** 1 → "1st", 22 → "22nd" */
export const ordinal = (n: number) => {
  const suffix =
    n % 10 === 1 && n !== 11
      ? "st"
      : n % 10 === 2 && n !== 12
        ? "nd"
        : n % 10 === 3 && n !== 13
          ? "rd"
          : "th";
  return `${n}${suffix}`;
};

/** "1st of the month", "5th of the month" */
export const formatStartDay = (day: number) => `${ordinal(day)} of the month`;

/** Human description of a billing month, e.g. "5 Oct – 4 Nov" style range for a start day. */
export function describeBillingMonth(startDay: number) {
  if (startDay === 1) return "Runs from the 1st to the last day of each month";
  return `Runs from the ${ordinal(startDay)} to the ${ordinal(startDay - 1)} of the next month`;
}

/** Shareable join link for a mess's join code. */
export const joinLink = (origin: string, joinCode: string) => `${origin}/join?code=${joinCode}`;
