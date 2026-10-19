import type { ApprovalStatus } from "@/types/api";
import type { MonthStatus } from "@/features/months/months-types";

/** Meal counts are decimal strings from the API ("1", "0.5"), like money. */
export type Count = string;

export interface MealSlot {
  id: string;
  name: string;
  /** How much one of these meals counts, e.g. "0.5" for breakfast. */
  weight: Count;
  /** `HH:mm` in the mess timezone; null = locks when the day starts. */
  cutoffTime: string | null;
  sortOrder: number;
  isActive: boolean;
}

export interface MealValue {
  quantity: Count;
  guestQuantity: Count;
  note: string | null;
}

export interface DaySlot extends MealSlot {
  /** ISO timestamp when members stop being able to change this meal for the day. */
  cutoffAt: string;
  isPastCutoff: boolean;
  /** Whether the caller can change their own meal for this slot right now. */
  canEditOwn: boolean;
  menu: { id: string; items: string; note: string | null } | null;
}

export interface DayRow {
  member: { id: string; name: string; avatarUrl: string | null; isYou: boolean };
  /** Keyed by slot id. A missing slot means no meal recorded (counts as 0). */
  meals: Record<string, MealValue>;
  weightedMeals: Count;
}

/** One day of meals for the whole mess: what the cook needs, and what managers edit. */
export interface MealDay {
  date: string;
  month: { id: string; year: number; month: number; status: MonthStatus };
  editable: boolean;
  canEditOthers: boolean;
  allowGuestMeal: boolean;
  you: { memberId: string; defaultMealOn: boolean };
  slots: DaySlot[];
  rows: DayRow[];
  /** Keyed by slot id. */
  totals: Record<string, { meals: Count; guests: Count }>;
  weightedTotal: Count;
}

export interface MealEntryInput {
  memberId: string;
  slotId: string;
  date: string;
  quantity: number;
  guestQuantity: number;
  note?: string | null;
}

export interface MemberMeals {
  memberId: string;
  from: string;
  to: string;
  days: { date: string; meals: Record<string, MealValue>; weightedMeals: Count }[];
  totals: { weightedMeals: Count; meals: Count; guestMeals: Count };
}

export interface PersonRef {
  id: string;
  name: string;
  avatarUrl: string | null;
}

export interface MealOffPeriod {
  id: string;
  fromDate: string;
  toDate: string;
  reason: string | null;
  createdAt: string;
  member: PersonRef;
}

export interface MealRequest {
  id: string;
  date: string;
  slot: { id: string; name: string } | null;
  request: string;
  status: ApprovalStatus;
  response: string | null;
  respondedAt: string | null;
  respondedBy: PersonRef | null;
  createdAt: string;
  member: PersonRef;
}

export interface MenuItem {
  id: string;
  date: string;
  slot: { id: string; name: string };
  items: string;
  note: string | null;
  updatedAt: string;
}
