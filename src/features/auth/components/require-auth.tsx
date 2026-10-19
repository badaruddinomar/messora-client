"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { FullPageSpinner } from "@/components/ui/spinner";
import { ROUTES } from "@/constants/routes";
import { useAuthStatus } from "../hooks/use-auth-status";

/** Renders children only for logged-in users; otherwise redirects to /login?next=<current URL>. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const status = useAuthStatus();
  const router = useRouter();

  useEffect(() => {
    if (status !== "unauthenticated") return;
    // Keep the query string too, e.g. /join?code=ABCD1234 should survive logging in.
    const next = window.location.pathname + window.location.search;
    router.replace(`${ROUTES.login}?next=${encodeURIComponent(next)}`);
  }, [status, router]);

  return status === "authenticated" ? children : <FullPageSpinner />;
}
