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
import { useApproveDepositMutation, useDepositsInfiniteQuery } from "../deposits-api";
import { methodLabel, type Deposit } from "../deposits-types";
import { RejectDepositDialog } from "./deposit-detail-dialog";

/** Deposits waiting for a manager to confirm the money arrived. */
export function DepositReviewQueue() {
  const mess = useCurrentMess();
  const query = useDepositsInfiniteQuery({ messId: mess.id, status: "PENDING" });
  const pending = query.data?.pages.flatMap((p) => p.items) ?? [];

  if (query.error)
    return <ErrorState error={query.error} onRetry={query.refetch} retrying={query.isFetching} />;
  if (query.isLoading) return <Skeleton className="h-40 rounded-xl" />;
  if (pending.length === 0) {
    return (
      <EmptyState
        icon={CheckCheck}
        title="All caught up"
        description="New deposits to confirm show up here."
      />
    );
  }
  return (
    <div className="grid gap-3">
      {pending.map((d) => (
        <ReviewCard key={d.id} deposit={d} />
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

function ReviewCard({ deposit }: { deposit: Deposit }) {
  const mess = useCurrentMess();
  const [approve, { isLoading }] = useApproveDepositMutation();
  const [rejecting, setRejecting] = useState(false);

  const onApprove = async () => {
    const res = await approve({ messId: mess.id, depositId: deposit.id });
    if (res.error) return toast.error(getErrorMessage(res.error));
    toast.success(`${deposit.member.name}'s deposit confirmed`);
  };

  return (
    <Card className="flex-row items-center gap-4 p-4">
      <UserAvatar name={deposit.member.name} src={deposit.member.avatarUrl} />
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-baseline gap-x-2">
          <MoneyText value={deposit.amount} className="text-lg font-semibold" />
          <span className="text-sm text-muted-foreground">
            {deposit.member.name} · {formatDay(deposit.date)}
          </span>
        </p>
        <p className="truncate text-sm text-muted-foreground">
          {methodLabel(deposit.method)}
          {deposit.transactionRef && (
            <>
              {" · "}
              <span className="font-mono">{deposit.transactionRef}</span>
            </>
          )}
          {deposit.note && ` · ${deposit.note}`}
        </p>
      </div>
      <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
        <Button variant="outline" size="sm" onClick={() => setRejecting(true)}>
          Reject
        </Button>
        <Button size="sm" onClick={onApprove} loading={isLoading}>
          Confirm
        </Button>
      </div>
      <RejectDepositDialog deposit={deposit} open={rejecting} onOpenChange={setRejecting} />
    </Card>
  );
}
