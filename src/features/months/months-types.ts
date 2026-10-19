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
