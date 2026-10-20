import type { PaidFrom } from "@/features/bazars/bazars-types";
import type { PersonRef } from "@/features/meals/meals-types";
import type { Money } from "@/types/api";

export type ExpenseCategory =
  | "ELECTRICITY"
  | "GAS"
  | "WATER"
  | "INTERNET"
  | "COOK_SALARY"
  | "MAID_SALARY"
  | "CLEANING"
  | "MAINTENANCE"
  | "HOUSE_RENT"
  | "UTENSILS"
  | "OTHER";

export type SplitType = "EQUAL" | "BY_MEAL" | "CUSTOM";
export type StaffRole = "COOK" | "MAID" | "GUARD" | "OTHER";
export type ChargeType = "SEAT_RENT" | "FINE" | "PERSONAL" | "ADJUSTMENT";

export interface Expense {
  id: string;
  monthId: string;
  category: ExpenseCategory;
  title: string;
  amount: Money;
  splitType: SplitType;
  paidFrom: PaidFrom;
  paidBy: PersonRef | null;
  staff: { id: string; name: string; role: StaffRole } | null;
  billDate: string;
  receiptUrl: string | null;
  createdAt: string;
  /** The caller's share of this expense. */
  yourShare: Money;
  canEdit: boolean;
}

export interface ExpenseDetail extends Expense {
  shares: { member: PersonRef; amount: Money }[];
}

export interface ExpenseInput {
  category: ExpenseCategory;
  title: string;
  amount: Money;
  splitType: SplitType;
  paidFrom: PaidFrom;
  paidByMemberId?: string | null;
  billDate: string;
  receiptKey?: string | null;
  shares?: { memberId: string; amount: Money }[];
}

export interface ExpenseSummary {
  monthId: string;
  total: Money;
  count: number;
  yourShare: Money;
  byPaidFrom: Record<PaidFrom, Money>;
  byCategory: { category: ExpenseCategory; total: Money }[];
}

export interface SplitPreview {
  monthId: string;
  /** BY_MEAL with no meals yet: split equally instead. */
  fellBackToEqual: boolean;
  shares: { member: PersonRef; weightedMeals: string; amount: Money }[];
}

export interface Staff {
  id: string;
  name: string;
  /** Managers only. */
  phone: string | null;
  role: StaffRole;
  monthlySalary: Money;
  isActive: boolean;
  joinedAt: string;
  paidThisMonth: boolean;
  paidAmount: Money;
}

export interface StaffInput {
  name: string;
  phone?: string | null;
  role: StaffRole;
  monthlySalary: Money;
}

export interface Charge {
  id: string;
  monthId: string;
  member: PersonRef;
  type: ChargeType;
  /** Negative for an adjustment that takes money off the bill. */
  amount: Money;
  description: string | null;
  periodFrom: string | null;
  periodTo: string | null;
  isProrated: boolean;
  createdAt: string;
  canEdit: boolean;
}

export const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  ELECTRICITY: "Electricity",
  GAS: "Gas",
  WATER: "Water",
  INTERNET: "Internet",
  COOK_SALARY: "Cook's salary",
  MAID_SALARY: "Maid's salary",
  CLEANING: "Cleaning",
  MAINTENANCE: "Maintenance",
  HOUSE_RENT: "House rent",
  UTENSILS: "Utensils",
  OTHER: "Other",
};

export const SPLIT_LABELS: Record<SplitType, string> = {
  EQUAL: "Equally",
  BY_MEAL: "By meals",
  CUSTOM: "Set amounts",
};

export const STAFF_ROLE_LABELS: Record<StaffRole, string> = {
  COOK: "Cook",
  MAID: "Maid",
  GUARD: "Guard",
  OTHER: "Other",
};

export const CHARGE_LABELS: Record<ChargeType, string> = {
  SEAT_RENT: "Seat rent",
  FINE: "Fine",
  PERSONAL: "Personal",
  ADJUSTMENT: "Adjustment",
};
