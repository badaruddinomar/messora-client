"use client";

import { useAppSelector } from "@/store/hooks";
import { useMeQuery } from "../auth-api";
import { selectAuthStatus } from "../auth-slice";

/** Resolves the session once (via /auth/me) unless a login already populated it. */
export function useAuthStatus() {
  const status = useAppSelector(selectAuthStatus);
  useMeQuery(undefined, { skip: status !== "unknown" });
  return status;
}
