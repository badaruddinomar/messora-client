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
  /** Sent back when closing (optimistic lock). */
  version: number;
  manager: { memberId: string; name: string; avatarUrl: string | null } | null;
}

export interface MonthPreviewRow {
  member: { id: string; name: string; avatarUrl: string | null; isYou: boolean };
  weightedMeals: string;
  mealCost: Money;
  sharedCost: Money;
  chargeTotal: Money;
  /** Seat rent counted in chargeTotal before the month is closed. */
  seatRentEstimate: Money;
  deposits: Money;
  ownPocketBazar: Money;
  ownPocketExpenses: Money;
  totalDeposit: Money;
  openingBalance: Money;
  /** Positive: the mess owes the member. Negative: the member owes the mess (BUSINESS_RULES §8). */
  closingBalance: Money;
  settledAmount: Money;
  isSettled: boolean;
}

/** The month so far (BUSINESS_RULES §5, §8, §9), from what's approved today. */
export interface MonthPreview {
  monthId: string;
  status: MonthStatus;
  /** CLOSED: the stored bill, never recalculated. Otherwise an estimate. */
  isFinal: boolean;
  closedAt: string | null;
  previousMonthClosed: boolean;
  totals: {
    totalBazar: Money;
    totalMeals: string;
    mealRate: string;
    totalDeposits: Money;
    totalExpenses: Money;
  };
  pending: { bazars: { count: number; total: Money }; deposits: { count: number; total: Money } };
  cash: {
    openingCash: Money;
    deposits: Money;
    settlementsIn: Money;
    messFundBazar: Money;
    messFundExpenses: Money;
    settlementsOut: Money;
    closingCash: Money;
  };
  members: MonthPreviewRow[];
}

export interface CloseCheck {
  month: Month;
  ended: boolean;
  earlierOpen: { id: string; label: string }[];
  pending: { bazars: number; deposits: number };
  warnings: { noMealsAtAll: boolean; membersWithoutMeals: { id: string; name: string }[] };
  canStartClosing: boolean;
  canClose: boolean;
}

export type PaymentMethod = "CASH" | "BKASH" | "NAGAD" | "ROCKET" | "BANK" | "OTHER";
export type SettlementDirection = "MEMBER_TO_MESS" | "MESS_TO_MEMBER";

export interface SettlementPayment {
  id: string;
  direction: SettlementDirection;
  amount: Money;
  method: PaymentMethod;
  transactionRef?: string | null;
  note?: string | null;
  paidAt: string;
}

export interface SettlementRow {
  summaryId: string;
  member: { id: string; name: string; avatarUrl: string | null };
  closingBalance: Money;
  /** MEMBER_TO_MESS: a due to collect; MESS_TO_MEMBER: a refund to give; null: nothing to settle. */
  direction: SettlementDirection | null;
  settledAmount: Money;
  remaining: Money;
  isSettled: boolean;
  /** The next month has closed, so what's left lives on in its bill. */
  carriedOver: boolean;
  payments: SettlementPayment[];
}

export interface Settlements {
  monthId: string;
  collectable: boolean;
  totals: { dueToMess: Money; owedToMembers: Money };
  rows: SettlementRow[];
}

export type HandoverStatus = "PENDING" | "CONFIRMED" | "DISPUTED";

export interface Handover {
  id: string;
  monthId: string;
  from: { id: string; name: string; avatarUrl: string | null };
  to: { id: string; name: string; avatarUrl: string | null };
  expectedAmount: Money;
  handedAmount: Money;
  /** handed − expected: negative means cash is missing. */
  difference: Money;
  status: HandoverStatus;
  note: string | null;
  confirmedAt: string | null;
  createdAt: string;
  canRespond: boolean;
}

/** One member's bill for a month, line by line. */
export interface Statement {
  month: { id: string; year: number; month: number; status: MonthStatus };
  member: { id: string; name: string; avatarUrl: string | null; isYou: boolean };
  isFinal: boolean;
  mealRate: string;
  totals: {
    weightedMeals: string;
    mealCost: Money;
    sharedCost: Money;
    chargeTotal: Money;
    totalDeposit: Money;
    openingBalance: Money;
    closingBalance: Money;
  };
  meals: { slot: string; meals: string; weight: string; weightedMeals: string }[];
  expenses: {
    id: string;
    title: string;
    category: string;
    billDate: string;
    amount: Money;
    splitType: string;
    share: Money;
  }[];
  /** The bazar shared equally because nobody ate (BUSINESS_RULES §5). */
  bazarShare: Money | null;
  charges: { id: string; type: string; description: string | null; amount: Money; isEstimate: boolean }[];
  deposits: { id: string; date: string; amount: Money; method: PaymentMethod }[];
  paidYourself: {
    kind: "BAZAR" | "EXPENSE";
    id: string;
    title: string;
    date: string;
    amount: Money;
    receiptUrl: string | null;
  }[];
  settlement: { settledAmount: Money; isSettled: boolean; payments: SettlementPayment[] } | null;
}
