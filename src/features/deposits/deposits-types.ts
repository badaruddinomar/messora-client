import type { PersonRef } from "@/features/meals/meals-types";
import type { ApprovalStatus, Money } from "@/types/api";

export type PaymentMethod = "CASH" | "BKASH" | "NAGAD" | "ROCKET" | "BANK" | "OTHER";

export const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "CASH", label: "Cash" },
  { value: "BKASH", label: "bKash" },
  { value: "NAGAD", label: "Nagad" },
  { value: "ROCKET", label: "Rocket" },
  { value: "BANK", label: "Bank" },
  { value: "OTHER", label: "Other" },
];

export const methodLabel = (method: PaymentMethod) => PAYMENT_METHODS.find((m) => m.value === method)!.label;

export interface Deposit {
  id: string;
  date: string;
  depositedAt: string;
  monthId: string;
  member: PersonRef;
  amount: Money;
  method: PaymentMethod;
  transactionRef: string | null;
  note: string | null;
  status: ApprovalStatus;
  receivedBy: PersonRef | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
  canEdit: boolean;
  canDelete: boolean;
  canReview: boolean;
}

export interface DepositInput {
  date: string;
  memberId?: string;
  amount: Money;
  method: PaymentMethod;
  transactionRef?: string | null;
  note?: string | null;
}

export interface DepositFilters {
  monthId?: string;
  status?: ApprovalStatus;
  memberId?: string;
  method?: PaymentMethod;
}

interface Total {
  total: Money;
  count: number;
}

export interface DepositSummary {
  monthId: string;
  approved: Total;
  pending: Total;
  rejected: Total;
  byMethod: Record<PaymentMethod, Money>;
  byMember: (Total & { member: PersonRef })[];
}
