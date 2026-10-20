"use client";

import { useState } from "react";
import { FilterX, ShoppingBasket } from "lucide-react";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useMembersQuery } from "@/features/members/members-api";
import { useCurrentMess } from "@/features/messes/mess-context";
import { MonthPicker } from "@/features/months/components/month-picker";
import type { Month } from "@/features/months/months-types";
import { useBazarsInfiniteQuery } from "../bazars-api";
import type { BazarFilters } from "../bazars-types";
import { useBazarFilters } from "../hooks/use-bazar-filters";
import { BazarDetailDialog } from "./bazar-detail-dialog";
import { BazarRow } from "./bazar-row";

const ALL = "all";

/** The month's bazars, newest first, filtered by status, shopper and who paid. */
export function BazarList({ month }: { month: Month | undefined }) {
  const mess = useCurrentMess();
  const { filters, setFilters, active, clear } = useBazarFilters();
  const { data: members } = useMembersQuery({ messId: mess.id });

  const args: { messId: string } & BazarFilters = {
    messId: mess.id,
    monthId: month?.id,
    ...(filters.status && { status: filters.status }),
    ...(filters.shopper && { shopperId: filters.shopper }),
    ...(filters.paid && { paidFrom: filters.paid }),
  };

  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        <MonthPicker className="col-span-2" />
        <Select
          value={filters.status ?? ALL}
          onValueChange={(v) =>
            setFilters({ status: v === ALL ? null : (v as NonNullable<typeof filters.status>) })
          }
        >
          <SelectTrigger className="w-full sm:w-36" aria-label="Status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Any status</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="APPROVED">Approved</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={filters.paid ?? ALL}
          onValueChange={(v) =>
            setFilters({ paid: v === ALL ? null : (v as NonNullable<typeof filters.paid>) })
          }
        >
          <SelectTrigger className="w-full sm:w-40" aria-label="Paid from">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Any payment</SelectItem>
            <SelectItem value="MESS_FUND">Mess fund</SelectItem>
            <SelectItem value="OWN_POCKET">Own pocket</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={filters.shopper ?? ALL}
          onValueChange={(v) => setFilters({ shopper: v === ALL ? null : v })}
        >
          <SelectTrigger className="col-span-2 w-full sm:w-44" aria-label="Shopper">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Everyone</SelectItem>
            {members?.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.id === mess.membership.id ? "Me" : m.user.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {active > 0 && (
          <Button variant="ghost" className="col-span-2 justify-self-start" onClick={clear}>
            <FilterX />
            Clear filters
          </Button>
        )}
      </div>

      {month ? <BazarResults args={args} filtered={active > 0} /> : <Skeleton className="h-64 rounded-xl" />}
    </div>
  );
}

function BazarResults({ args, filtered }: { args: { messId: string } & BazarFilters; filtered: boolean }) {
  const query = useBazarsInfiniteQuery(args);
  const [openId, setOpenId] = useState<string | null>(null);
  const bazars = query.data?.pages.flatMap((p) => p.items) ?? [];
  const open = bazars.find((b) => b.id === openId);

  if (query.error)
    return <ErrorState error={query.error} onRetry={query.refetch} retrying={query.isFetching} />;
  if (query.isLoading || !query.data) return <Skeleton className="h-64 rounded-xl" />;
  if (bazars.length === 0) {
    return (
      <EmptyState
        icon={ShoppingBasket}
        title={filtered ? "No bazars match these filters" : "No bazar yet this month"}
        description={
          filtered ? "Try another status or shopper." : "Whoever shops adds it here, with the receipt."
        }
      />
    );
  }

  return (
    <>
      <Card className="gap-0 py-0">
        <ul className="divide-y">
          {bazars.map((b) => (
            <BazarRow key={b.id} bazar={b} onOpen={() => setOpenId(b.id)} />
          ))}
        </ul>
      </Card>
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
      {open && <BazarDetailDialog bazar={open} open onOpenChange={(o) => !o && setOpenId(null)} />}
    </>
  );
}
