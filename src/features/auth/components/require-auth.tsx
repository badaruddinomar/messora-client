"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { FullPageSpinner } from "@/components/ui/spinner";
import { ROUTES } from "@/constants/routes";
import { useAuthStatus } from "../hooks/use-auth-status";

/** Renders children only for logged-in users; otherwise redirects to /login?next=<current path>. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const status = useAuthStatus();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "unauthenticated") router.replace(`${ROUTES.login}?next=${encodeURIComponent(pathname)}`);
  }, [status, router, pathname]);

  return status === "authenticated" ? children : <FullPageSpinner />;
}
