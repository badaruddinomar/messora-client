"use client";

import { useState } from "react";
import { CheckCheck } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { MoneyText } from "@/components/common/money-text";
import { UserAvatar } from "@/components/common/user-avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentMess } from "@/features/messes/mess-context";
import { getErrorMessage } from "@/lib/api-error";
import { formatDay } from "@/lib/format";
import { useApproveBazarMutation, useBazarsInfiniteQuery } from "../bazars-api";
import type { Bazar } from "../bazars-types";
import { BazarDetailDialog, PAID_FROM_LABELS } from "./bazar-detail-dialog";
import { itemsPreview } from "./bazar-row";
import { RejectBazarDialog } from "./reject-bazar-dialog";

/** Every pending bazar, newest first, with one-tap approve and reject for managers. */
export function ReviewQueue() {
  const mess = useCurrentMess();
  const query = useBazarsInfiniteQuery({ messId: mess.id, status: "PENDING" });
  const pending = query.data?.pages.flatMap((p) => p.items) ?? [];

  if (query.error)
    return <ErrorState error={query.error} onRetry={query.refetch} retrying={query.isFetching} />;
  if (query.isLoading) return <Skeleton className="h-48 rounded-xl" />;
  if (pending.length === 0) {
    return (
      <EmptyState
        icon={CheckCheck}
        title="All caught up"
        description="New bazars that need approval show up here."
      />
    );
  }
  return (
    <div className="grid gap-3">
      {pending.map((b) => (
        <ReviewCard key={b.id} bazar={b} />
      ))}
      {query.hasNextPage && (
        <Button
          variant="outline"
          className="justify-self-center"
          loading={query.isFetchingNextPage}
          onClick={() => query.fetchNextPage()}
        >
          Load more
        </Button>
      )}
    </div>
  );
}

function ReviewCard({ bazar }: { bazar: Bazar }) {
  const mess = useCurrentMess();
  const [approve, { isLoading }] = useApproveBazarMutation();
  const [rejecting, setRejecting] = useState(false);
  const [viewing, setViewing] = useState(false);

  const onApprove = async () => {
    const res = await approve({ messId: mess.id, bazarId: bazar.id });
    if (res.error) return toast.error(getErrorMessage(res.error));
    toast.success(`${bazar.shopper.name}'s bazar approved`);
  };

  return (
    <Card className="flex-row items-center gap-4 p-4">
      <button
        type="button"
        onClick={() => setViewing(true)}
        className="flex min-w-0 flex-1 items-center gap-3 rounded-md text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
      >
        {bazar.receiptUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- short-lived signed URL
          <img src={bazar.receiptUrl} alt="" className="size-14 shrink-0 rounded-md border object-cover" />
        ) : (
          <UserAvatar name={bazar.shopper.name} src={bazar.shopper.avatarUrl} className="size-14" />
        )}
        <span className="min-w-0">
          <span className="flex flex-wrap items-baseline gap-x-2">
            <MoneyText value={bazar.totalAmount} className="text-lg font-semibold" />
            <span className="text-sm text-muted-foreground">
              {bazar.shopper.name} · {formatDay(bazar.date)}
            </span>
          </span>
          <span className="block truncate text-sm text-muted-foreground">
            {PAID_FROM_LABELS[bazar.paidFrom]} · {itemsPreview(bazar)}
          </span>
        </span>
      </button>
      <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
        <Button variant="outline" size="sm" onClick={() => setRejecting(true)}>
          Reject
        </Button>
        <Button size="sm" onClick={onApprove} loading={isLoading}>
          Approve
        </Button>
      </div>
      <RejectBazarDialog bazar={bazar} open={rejecting} onOpenChange={setRejecting} />
      {viewing && <BazarDetailDialog bazar={bazar} open onOpenChange={setViewing} />}
    </Card>
  );
}
