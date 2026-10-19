export interface ApiResponse<T> {
  success: true;
  message: string;
  data: T;
}

export interface ApiErrorBody {
  success: false;
  message: string;
  details?: Record<string, string[] | undefined>;
}

export type PlatformRole = "USER" | "SUPER_ADMIN";
export type UserStatus = "ACTIVE" | "BLOCKED" | "DELETED";

export interface User {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  avatarUrl: string | null;
  platformRole: PlatformRole;
  status: UserStatus;
  language: string;
  phoneVerifiedAt: string | null;
  emailVerifiedAt: string | null;
  lastSeenAt: string | null;
  createdAt: string;
  updatedAt: string;
}
