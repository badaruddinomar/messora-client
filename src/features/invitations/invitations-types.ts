import type { MessRole } from "@/features/messes/messes-types";

export type InvitationStatus = "PENDING" | "ACCEPTED" | "DECLINED" | "EXPIRED" | "REVOKED";

export interface Invitation {
  id: string;
  email: string | null;
  phone: string | null;
  role: MessRole;
  status: InvitationStatus;
  expiresAt: string;
  createdAt: string;
  invitedBy: string;
  mess: { id: string; name: string; address: string | null };
}

export interface CreatedInvitation {
  invitation: Invitation;
  /** Only returned when the invitation is created: share it over WhatsApp/SMS. */
  inviteUrl: string;
  emailSent: boolean;
}

export interface InvitationPreview {
  messName: string;
  messAddress: string | null;
  activeMemberCount: number;
  invitedBy: string;
  role: MessRole;
  status: InvitationStatus;
  expiresAt: string;
}
