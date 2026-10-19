"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { parseAsString, useQueryState } from "nuqs";
import { FullPageSpinner } from "@/components/ui/spinner";
import { DEFAULT_AUTHENTICATED_ROUTE } from "@/constants/routes";
import { useAuthStatus } from "../hooks/use-auth-status";
import { safeNext } from "../utils";

/** Renders children only for guests; logged-in users are sent to `?next=` or the dashboard. */
export function RequireGuest({ children }: { children: ReactNode }) {
  const status = useAuthStatus();
  const router = useRouter();
  const [next] = useQueryState("next", parseAsString);

  useEffect(() => {
    if (status === "authenticated") router.replace(safeNext(next) ?? DEFAULT_AUTHENTICATED_ROUTE);
  }, [status, router, next]);

  return status === "unauthenticated" ? children : <FullPageSpinner />;
}
