"use client";

import { parseAsStringLiteral, useQueryState } from "nuqs";
import { Clock, Plus, Wallet } from "lucide-react";
import { MoneyText } from "@/components/common/money-text";
import { PageHeader } from "@/components/common/page-header";
import { StatCard, StatCardSkeleton } from "@/components/common/stat-card";
import { UserAvatar } from "@/components/common/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCurrentMess, useMessPermissions } from "@/features/messes/mess-context";
import { BalancePreviewCard } from "@/features/months/components/balance-preview-card";
import { MonthReadOnlyBanner } from "@/features/months/components/month-read-only-banner";
import { useSelectedMonth } from "@/features/months/hooks/use-selected-month";
import { useDepositSummaryQuery } from "../deposits-api";
import { DepositFormDialog } from "./deposit-form-dialog";
import { DepositList } from "./deposit-list";
import { DepositReviewQueue } from "./deposit-review-queue";

const TABS = ["list", "review"] as const;
type Tab = (typeof TABS)[number];

/** Deposits: what members paid into the mess, and (for managers) what's waiting to be confirmed. */
export function DepositsPage() {
  const mess = useCurrentMess();
  const { canManage } = useMessPermissions();
  const { selected: month } = useSelectedMonth();
  const [tab, setTab] = useQueryState("tab", parseAsStringLiteral(TABS).withDefault("list"));
  const { data: summary } = useDepositSummaryQuery({ messId: mess.id, monthId: month?.id }, { skip: !month });
  const pending = canManage ? (summary?.pending.count ?? 0) : 0;

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Deposits"
        description={
          canManage
            ? "Money members paid into the mess. Confirm each one once it arrives."
            : "Money you paid into the mess."
        }
        actions={
          <DepositFormDialog
            trigger={(open) => (
              <Button onClick={open}>
                <Plus />
                {canManage ? "Record deposit" : "Add deposit"}
              </Button>
            )}
          />
        }
      />

      <Tabs value={tab} onValueChange={(v) => setTab(v === "list" ? null : (v as Tab))}>
        {canManage && (
          <TabsList className="w-full sm:w-fit">
            <TabsTrigger value="list">Deposits</TabsTrigger>
            <TabsTrigger value="review">
              To confirm
              {pending > 0 && (
                <Badge variant="warning" className="tabular ml-1 px-1.5">
                  {pending}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
        )}

        <TabsContent value="list" className="grid gap-4">
          {month && <MonthReadOnlyBanner month={month} />}
          <div className="grid grid-cols-2 gap-3">
            {summary ? (
              <>
                <StatCard
                  label={canManage ? "Collected this month" : "You paid this month"}
                  icon={Wallet}
                  value={<MoneyText value={summary.approved.total} compact />}
                  helper={`${summary.approved.count} confirmed`}
                />
                <StatCard
                  label="Waiting to be confirmed"
                  icon={Clock}
                  value={<MoneyText value={summary.pending.total} compact />}
                  helper={summary.pending.count === 1 ? "1 deposit" : `${summary.pending.count} deposits`}
                />
              </>
            ) : (
              <>
                <StatCardSkeleton />
                <StatCardSkeleton />
              </>
            )}
          </div>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
            <DepositList month={month} />
            <div className="grid gap-4">
              {month?.isCurrent && <BalancePreviewCard />}
              <MemberTotalsCard monthId={month?.id} />
            </div>
          </div>
        </TabsContent>
        {canManage && (
          <TabsContent value="review">
            <DepositReviewQueue />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

/** Confirmed deposits per member this month. */
function MemberTotalsCard({ monthId }: { monthId: string | undefined }) {
  const mess = useCurrentMess();
  const { data } = useDepositSummaryQuery({ messId: mess.id, monthId }, { skip: !monthId });

  return (
    <Card>
      <CardHeader>
        <CardTitle>By member</CardTitle>
        <CardDescription>Confirmed deposits this month.</CardDescription>
      </CardHeader>
      <CardContent>
        {!data ? (
          <Skeleton className="h-24 rounded-lg" />
        ) : data.byMember.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nobody yet.</p>
        ) : (
          <ul className="grid gap-3">
            {data.byMember.map((m) => (
              <li key={m.member.id} className="flex items-center gap-3">
                <UserAvatar name={m.member.name} src={m.member.avatarUrl} size="sm" />
                <span className="min-w-0 flex-1 truncate text-sm font-medium">
                  {m.member.id === mess.membership.id ? "You" : m.member.name}
                </span>
                <MoneyText value={m.total} className="text-sm font-semibold" />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
