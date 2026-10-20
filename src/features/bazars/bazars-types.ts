import type { PersonRef } from "@/features/meals/meals-types";
import type { ApprovalStatus, Money } from "@/types/api";

export type PaidFrom = "MESS_FUND" | "OWN_POCKET";

export interface BazarItem {
  id: string;
  name: string;
  quantity: string | null;
  unit: string | null;
  totalPrice: Money;
}

export interface Bazar {
  id: string;
  date: string;
  monthId: string;
  shopper: PersonRef;
  totalAmount: Money;
  paidFrom: PaidFrom;
  /** Short-lived link to the receipt image. */
  receiptUrl: string | null;
  note: string | null;
  status: ApprovalStatus;
  approvedBy: PersonRef | null;
  approvedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
  items: BazarItem[];
  canEdit: boolean;
  canDelete: boolean;
  canReview: boolean;
}

export interface BazarItemInput {
  name: string;
  quantity?: string | null;
  unit?: string | null;
  totalPrice: Money;
}

export interface BazarInput {
  date: string;
  shopperId?: string;
  paidFrom: PaidFrom;
  items: BazarItemInput[];
  totalAmount?: Money;
  /** From an upload; null removes the receipt. */
  receiptKey?: string | null;
  note?: string | null;
}

export interface BazarFilters {
  monthId?: string;
  status?: ApprovalStatus;
  shopperId?: string;
  paidFrom?: PaidFrom;
}

interface Total {
  total: Money;
  count: number;
}

export interface BazarSummary {
  monthId: string;
  approved: Total;
  pending: Total;
  rejected: Total;
  byPaidFrom: Record<PaidFrom, Money>;
  byShopper: (Total & { member: PersonRef })[];
}

export interface BazarDuty {
  id: string;
  date: string;
  isDone: boolean;
  member: PersonRef;
}

export interface UploadTarget {
  url: string;
  method: "PUT";
  headers: Record<string, string>;
  expiresAt: string;
}
