"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ErrorState } from "@/components/common/error-state";
import { FullPageSpinner } from "@/components/ui/spinner";
import { messRoutes, ROUTES } from "@/constants/routes";
import { readLastMess } from "../last-mess";
import { useMyMessesQuery } from "../messes-api";

/**
 * The default landing page after login: opens the mess the user used last (or their only one),
 * otherwise the messes hub where they can create or join one.
 */
export function DashboardRedirect() {
  const router = useRouter();
  const { data: messes, error, refetch, isFetching } = useMyMessesQuery();

  useEffect(() => {
    if (!messes) return;
    const active = messes.filter((m) => m.membership.status === "ACTIVE");
    const lastSlug = readLastMess();
    const target = active.find((m) => m.slug === lastSlug) ?? active[0];
    router.replace(target ? messRoutes(target.slug).overview : ROUTES.messes);
  }, [messes, router]);

  if (error) return <ErrorState error={error} onRetry={refetch} retrying={isFetching} />;
  return <FullPageSpinner />;
}
