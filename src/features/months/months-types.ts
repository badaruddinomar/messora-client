import type { Money } from "@/types/api";

export type MonthStatus = "OPEN" | "CLOSING" | "CLOSED";

export interface Month {
  id: string;
  year: number;
  /** 1-12 */
  month: number;
  /** `YYYY-MM-DD`, inclusive. */
  startDate: string;
  endDate: string;
  status: MonthStatus;
  /** Today falls inside this month. */
  isCurrent: boolean;
  /** The month is over but hasn't been closed yet. */
  hasEnded: boolean;
  closedAt: string | null;
  manager: { memberId: string; name: string; avatarUrl: string | null } | null;
}

export interface MonthPreviewRow {
  member: { id: string; name: string; avatarUrl: string | null; isYou: boolean };
  weightedMeals: string;
  mealCost: Money;
  sharedCost: Money;
  chargeTotal: Money;
  deposits: Money;
  ownPocketBazar: Money;
  totalDeposit: Money;
  openingBalance: Money;
  /** Positive: the mess owes the member. Negative: the member owes the mess (BUSINESS_RULES §8). */
  closingBalance: Money;
}

/** The month so far (BUSINESS_RULES §5, §8, §9), from what's approved today. */
export interface MonthPreview {
  monthId: string;
  isFinal: boolean;
  previousMonthClosed: boolean;
  totals: { totalBazar: Money; totalMeals: string; mealRate: string; totalDeposits: Money };
  pending: { bazars: { count: number; total: Money }; deposits: { count: number; total: Money } };
  cash: {
    openingCash: Money;
    deposits: Money;
    settlementsIn: Money;
    messFundBazar: Money;
    settlementsOut: Money;
    closingCash: Money;
  };
  members: MonthPreviewRow[];
}
