export interface ApiResponse<T> {
  success: true;
  message: string;
  data: T;
}

/** Mirrors `src/constants/error-codes.ts` on the server. */
export type ApiErrorCode =
  | "BAD_REQUEST"
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR"
  | "INVALID_CREDENTIALS"
  | "ACCOUNT_BLOCKED"
  | "SESSION_EXPIRED"
  | "INVALID_CODE"
  | "CODE_COOLDOWN"
  | "NOT_A_MEMBER"
  | "MEMBERSHIP_INACTIVE"
  | "INSUFFICIENT_ROLE"
  | "INVALID_JOIN_CODE"
  | "ALREADY_MEMBER"
  | "ALREADY_REQUESTED"
  | "MEMBERSHIP_SUSPENDED"
  | "INVITATION_INVALID"
  | "MONTH_CLOSED"
  | "DATE_OUTSIDE_MONTHS"
  | "MONTHS_OUT_OF_ORDER"
  | "LAST_ADMIN"
  | "CONFIRMATION_MISMATCH"
  | "MEAL_CUTOFF_PASSED"
  | "MEAL_EDITING_DISABLED"
  | "GUEST_MEALS_DISABLED"
  | "MEMBER_NOT_ACTIVE_ON_DATE"
  | "DATE_IN_FUTURE"
  | "TOTAL_MISMATCH"
  | "RECEIPT_NOT_FOUND"
  | "NOT_EDITABLE"
  | "DUPLICATE_TRANSACTION"
  | "SHARES_MISMATCH"
  | "SALARY_ALREADY_PAID"
  | "MONTH_NOT_ENDED"
  | "PENDING_ENTRIES"
  | "VERSION_CONFLICT"
  | "BALANCE_CARRIED_OVER"
  | "OVERPAYMENT";

export interface ApiErrorBody {
  success: false;
  code: ApiErrorCode;
  message: string;
  details?: Record<string, string[] | undefined>;
}

export type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";

/** Cursor-paginated list. */
export interface Page<T> {
  items: T[];
  nextCursor: string | null;
}

/** Money is always a decimal string from the API (e.g. "1250.50"); never parse it into a float for math. */
export type Money = string;
