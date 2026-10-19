"use client";

import { useEffect, type ReactNode } from "react";
import Link from "next/link";
import { Ban, Clock, SearchX } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ROUTES } from "@/constants/routes";
import { getErrorMessage } from "@/lib/api-error";
import { useMessFromRoute } from "../hooks/use-mess-from-route";
import { rememberLastMess } from "../last-mess";
import { CurrentMessProvider } from "../mess-context";
import { useCancelJoinRequestMutation } from "../messes-api";

/**
 * Wraps every `/m/[slug]` page: resolves the mess from the URL and only renders the page for
 * active members. Pending, suspended and unknown messes get a clear explanation instead.
 */
export function MessScope({ children }: { children: ReactNode }) {
  const { slug, mess, isLoading, error, refetch, isFetching } = useMessFromRoute();
  const active = mess?.membership.status === "ACTIVE";

  useEffect(() => {
    if (slug && active) rememberLastMess(slug);
  }, [slug, active]);

  if (isLoading) return <MessPageSkeleton />;
  if (error) return <ErrorState error={error} onRetry={refetch} retrying={isFetching} />;

  if (!mess) {
    return (
      <EmptyState
        icon={SearchX}
        title="Mess not found"
        description="It may have been deleted, or you're not a member of it."
        action={
          <Button asChild>
            <Link href={ROUTES.messes}>Go to my messes</Link>
          </Button>
        }
      />
    );
  }

  if (mess.membership.status === "PENDING") return <PendingApproval messId={mess.id} messName={mess.name} />;

  if (mess.membership.status === "SUSPENDED") {
    return (
      <EmptyState
        icon={Ban}
        title="Your membership is suspended"
        description={`An admin of ${mess.name} has suspended your membership. Talk to them to get access again.`}
        action={
          <Button asChild variant="outline">
            <Link href={ROUTES.messes}>Go to my messes</Link>
          </Button>
        }
      />
    );
  }

  return <CurrentMessProvider mess={mess}>{children}</CurrentMessProvider>;
}

function PendingApproval({ messId, messName }: { messId: string; messName: string }) {
  const [cancel, { isLoading }] = useCancelJoinRequestMutation();
  return (
    <EmptyState
      icon={Clock}
      title="Waiting for approval"
      description={`You've asked to join ${messName}. A manager will review your request soon.`}
      action={
        <div className="flex flex-wrap justify-center gap-2">
          <Button asChild variant="outline">
            <Link href={ROUTES.messes}>Go to my messes</Link>
          </Button>
          <Button
            variant="ghost"
            loading={isLoading}
            onClick={async () => {
              const res = await cancel(messId);
              if (res.error) toast.error(getErrorMessage(res.error));
              else toast.success("Request cancelled");
            }}
          >
            Cancel request
          </Button>
        </div>
      }
    />
  );
}

/** Matches the page header + content layout, so nothing jumps when the mess loads. */
export function MessPageSkeleton() {
  return (
    <div className="grid gap-8" aria-busy aria-label="Loading">
      <div className="space-y-2">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-4 w-40" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
      </div>
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}
