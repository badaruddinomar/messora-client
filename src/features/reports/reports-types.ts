import type { ExpenseCategory } from "@/features/expenses/expenses-types";
import type { Month, MonthStatus } from "@/features/months/months-types";
import type { Money } from "@/types/api";

/** `GET /messes/:messId/dashboard`. `manager` is null for plain members. */
export interface Dashboard {
  month: Month;
  today: string;
  mealRate: string;
  you: {
    weightedMeals: string;
    mealCost: Money;
    totalDeposit: Money;
    /** Negative: you owe so far; positive: the mess owes you. */
    closingBalance: Money;
    /** Your next bazar duty that isn't done, today or later. */
    nextDuty: string | null;
  };
  manager: ManagerDashboard | null;
}

export interface ManagerDashboard {
  cashInHand: Money;
  pending: {
    bazars: { count: number; total: Money };
    deposits: { count: number; total: Money };
    joinRequests: number;
    mealRequests: number;
  };
  /** Everyone's balance so far this month, most owed first. */
  balances: { member: { id: string; name: string }; balance: Money }[];
  dueSoFar: Money;
  creditSoFar: Money;
  lastClosed: {
    id: string;
    year: number;
    month: number;
    collectable: boolean;
    dueToMess: Money;
    owedToMembers: Money;
    unsettled: number;
  } | null;
}

/** One month in `GET /reports/trends` (oldest first). Open months are the month so far. */
export interface TrendPoint {
  monthId: string;
  year: number;
  month: number;
  status: MonthStatus;
  isFinal: boolean;
  mealRate: string;
  totalMeals: string;
  totalBazar: Money;
  totalExpenses: Money;
  totalDeposits: Money;
}

export interface MonthReport {
  month: { id: string; year: number; month: number; status: MonthStatus };
  expensesByCategory: { category: ExpenseCategory; total: Money; count: number }[];
  /** Every day of the month up to today. */
  bazarByDay: { date: string; total: Money; count: number }[];
}

export type ExportKind = "summary" | "bazars";
