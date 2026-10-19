import type { MemberStatus, MessRole } from "@/features/messes/messes-types";

export interface Member {
  id: string;
  role: MessRole;
  status: MemberStatus;
  joinedAt: string | null;
  leftAt: string | null;
  /** Managers only. */
  leaveReason: string | null;
  requestedAt: string;
  user: {
    id: string;
    name: string;
    phone: string;
    /** Managers only. */
    email: string | null;
    avatarUrl: string | null;
  };
}
