"use client";

import { Clock, ShoppingBasket, Wallet } from "lucide-react";
import { MoneyText } from "@/components/common/money-text";
import { StatCard, StatCardSkeleton } from "@/components/common/stat-card";
import { UserAvatar } from "@/components/common/user-avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentMess } from "@/features/messes/mess-context";
import { useBazarSummaryQuery } from "../bazars-api";

export function BazarSummaryCards({ monthId }: { monthId: string | undefined }) {
  const mess = useCurrentMess();
  const { data } = useBazarSummaryQuery({ messId: mess.id, monthId }, { skip: !monthId });

  if (!data) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCardSkeleton className="col-span-2 sm:col-span-1" />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      <StatCard
        className="col-span-2 sm:col-span-1"
        label="Bazar this month"
        icon={ShoppingBasket}
        value={<MoneyText value={data.approved.total} compact />}
        helper={`${data.approved.count} approved · counts toward the meal rate`}
      />
      <StatCard
        label="Waiting for approval"
        icon={Clock}
        value={<MoneyText value={data.pending.total} compact />}
        helper={data.pending.count === 1 ? "1 bazar" : `${data.pending.count} bazars`}
      />
      <StatCard
        label="From the mess fund"
        icon={Wallet}
        value={<MoneyText value={data.byPaidFrom.MESS_FUND} compact />}
        helper={
          <>
            Own pocket <MoneyText value={data.byPaidFrom.OWN_POCKET} compact />
          </>
        }
      />
    </div>
  );
}

/** Who shopped how much this month (approved bazars). */
export function ShoppersCard({ monthId }: { monthId: string | undefined }) {
  const mess = useCurrentMess();
  const { data } = useBazarSummaryQuery({ messId: mess.id, monthId }, { skip: !monthId });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Who shopped</CardTitle>
        <CardDescription>Approved bazar per member this month.</CardDescription>
      </CardHeader>
      <CardContent>
        {!data ? (
          <Skeleton className="h-24 rounded-lg" />
        ) : data.byShopper.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nobody yet.</p>
        ) : (
          <ul className="grid gap-3">
            {data.byShopper.map((s) => (
              <li key={s.member.id} className="flex items-center gap-3">
                <UserAvatar name={s.member.name} src={s.member.avatarUrl} size="sm" />
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{s.member.name}</span>
                <span className="text-xs text-muted-foreground">{s.count}×</span>
                <MoneyText value={s.total} className="text-sm font-semibold" />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
