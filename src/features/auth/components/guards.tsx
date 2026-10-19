"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { parseAsString, useQueryState } from "nuqs";
import { FullPageSpinner } from "@/components/spinner";
import { useAppSelector } from "@/store/hooks";
import { useMeQuery } from "../auth-api";
import { selectAuthStatus } from "../auth-slice";

/** Only allow same-site relative paths, to avoid open redirects via `?next=`. */
export const safeNext = (next: string | null) => (next?.startsWith("/") && !next.startsWith("//") ? next : null);

/** Resolves the session once (via /auth/me) unless a login already populated it. */
function useAuthStatus() {
  const status = useAppSelector(selectAuthStatus);
  useMeQuery(undefined, { skip: status !== "unknown" });
  return status;
}

/** Renders children only for logged-in users; otherwise redirects to /login?next=<current path>. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const status = useAuthStatus();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "unauthenticated") router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [status, router, pathname]);

  return status === "authenticated" ? children : <FullPageSpinner />;
}

/** Renders children only for guests; logged-in users are sent to `?next=` or the dashboard. */
export function RequireGuest({ children }: { children: ReactNode }) {
  const status = useAuthStatus();
  const router = useRouter();
  const [next] = useQueryState("next", parseAsString);

  useEffect(() => {
    if (status === "authenticated") router.replace(safeNext(next) ?? "/dashboard");
  }, [status, router, next]);

  return status === "unauthenticated" ? children : <FullPageSpinner />;
}
