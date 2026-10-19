export type MessRole = "ADMIN" | "MANAGER" | "MEMBER";
export type MemberStatus = "PENDING" | "ACTIVE" | "SUSPENDED" | "LEFT";
export type MessGender = "MALE" | "FEMALE" | "MIXED";

export interface MyMembership {
  id: string;
  role: MessRole;
  status: MemberStatus;
  /** A plain member who manages the current month gets manager powers for it. */
  isMonthManager: boolean;
}

export interface Mess {
  id: string;
  name: string;
  slug: string;
  address: string | null;
  logoUrl: string | null;
  gender: MessGender;
  currency: string;
  timezone: string;
  monthStartDay: number;
  createdAt: string;
  /** Only sent to managers. */
  joinCode: string | null;
  activeMemberCount?: number;
  membership: MyMembership;
}

export interface MessSettings {
  autoGenerateMeals: boolean;
  allowMemberMealEdit: boolean;
  allowGuestMeal: boolean;
  requireBazarApproval: boolean;
  requireDepositApproval: boolean;
  prorateSeatRent: boolean;
  mealRateDecimals: number;
  dueReminderDay: number | null;
  updatedAt: string;
}

export interface MealSlotInput {
  name: string;
  weight: number;
  cutoffTime?: string | null;
}

export interface CreateMessInput {
  name: string;
  address?: string;
  gender: MessGender;
  monthStartDay: number;
  timezone?: string;
  mealSlots: MealSlotInput[];
}

export type UpdateMessInput = Partial<
  Pick<Mess, "name" | "address" | "gender" | "monthStartDay" | "timezone">
>;
