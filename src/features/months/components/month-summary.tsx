"use client";

import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { AlertTriangle, Users } from "lucide-react";
import { DataTable } from "@/components/common/data-table";
import { EmptyState } from "@/components/common/empty-state";
import { MoneyText } from "@/components/common/money-text";
import { StatCard, StatCardSkeleton } from "@/components/common/stat-card";
import { UserAvatar } from "@/components/common/user-avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { messRoutes } from "@/constants/routes";
import { useCurrentMess, useMessPermissions } from "@/features/messes/mess-context";
import { formatCount, formatMoney } from "@/lib/format";
import { sumMoney } from "@/lib/money";
import { useMonthPreviewQuery } from "../months-api";
import type { Month, MonthPreviewRow } from "../months-types";
import { monthLabel } from "../utils";

const totalCost = (r: MonthPreviewRow) => sumMoney([r.mealCost, r.sharedCost, r.chargeTotal]);

const columns: ColumnDef<MonthPreviewRow, unknown>[] = [
  {
    id: "member",
    header: "Member",
    accessorFn: (r) => r.member.name,
    cell: ({ row }) => (
      <span className="flex items-center gap-2">
        <UserAvatar name={row.original.member.name} src={row.original.member.avatarUrl} size="sm" />
        <span className="font-medium">{row.original.member.name}</span>
        {row.original.member.isYou && <Badge variant="muted">You</Badge>}
      </span>
    ),
  },
  {
    id: "meals",
    header: () => <span className="block text-right">Meals</span>,
    accessorFn: (r) => Number(r.weightedMeals),
    cell: ({ row }) => (
      <span className="tabular block text-right">{formatCount(row.original.weightedMeals)}</span>
    ),
  },
  {
    id: "cost",
    header: () => <span className="block text-right">Costs</span>,
    accessorFn: (r) => Number(totalCost(r)),
    cell: ({ row }) => <MoneyText value={totalCost(row.original)} className="block text-right" />,
  },
  {
    id: "deposit",
    header: () => <span className="block text-right">Deposits</span>,
    accessorFn: (r) => Number(r.totalDeposit),
    cell: ({ row }) => <MoneyText value={row.original.totalDeposit} className="block text-right" />,
  },
  {
    id: "balance",
    header: () => <span className="block text-right">Balance</span>,
    accessorFn: (r) => Number(r.closingBalance),
    cell: ({ row }) => (
      <MoneyText
        value={row.original.closingBalance}
        variant="balance"
        className="block text-right font-medium"
      />
    ),
  },
];

/**
 * Month so far: meal rate, totals and everyone's running balance. Everyone can see it (a mess runs on
 * this transparency, BUSINESS_RULES §2); it's an estimate until the month is closed.
 */
export function MonthSummary({ month }: { month: Month }) {
  const mess = useCurrentMess();
  const { canManage } = useMessPermissions();
  const router = useRouter();
  const { data, isLoading } = useMonthPreviewQuery({ messId: mess.id, monthId: month.id });
  const pending = data ? data.pending.bazars.count + data.pending.deposits.count : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{monthLabel(month)} so far</CardTitle>
        <CardDescription>
          From approved bazar, deposits and meals. Final when the month is closed.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {data ? (
            <>
              <StatCard
                label="Meal rate"
                value={formatMoney(data.totals.mealRate)}
                helper="Per weighted meal"
              />
              <StatCard label="Bazar" value={<MoneyText value={data.totals.totalBazar} compact />} />
              <StatCard label="Meals" value={formatCount(data.totals.totalMeals)} helper="Weighted" />
              <StatCard
                label="Cash in hand"
                value={<MoneyText value={data.cash.closingCash} compact />}
                helper={data.isFinal ? "At closing" : "Deposits minus what the fund paid"}
              />
            </>
          ) : (
            Array.from({ length: 4 }, (_, i) => <StatCardSkeleton key={i} />)
          )}
        </div>

        {canManage && pending > 0 && data && (
          <Alert variant="warning">
            <AlertTriangle />
            <AlertDescription className="text-current/80">
              Not counted yet: {data.pending.bazars.count} bazar ({formatMoney(data.pending.bazars.total)})
              and {data.pending.deposits.count} deposit ({formatMoney(data.pending.deposits.total)}) waiting
              for approval.
            </AlertDescription>
          </Alert>
        )}

        <DataTable
          columns={columns}
          data={data?.members}
          isLoading={isLoading}
          getRowId={(r) => r.member.id}
          onRowClick={(r) =>
            (canManage || r.member.isYou) && router.push(messRoutes(mess.slug).bill(month.id, r.member.id))
          }
          empty={<EmptyState icon={Users} title="Nobody in the mess this month" />}
          renderCard={(row) => {
            const r = row.original;
            return (
              <div className="flex items-center gap-3">
                <UserAvatar name={r.member.name} src={r.member.avatarUrl} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {r.member.name}
                    {r.member.isYou && " (you)"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatCount(r.weightedMeals)} meals · paid {formatMoney(r.totalDeposit)}
                  </p>
                </div>
                <MoneyText value={r.closingBalance} variant="balance" className="text-sm font-medium" />
              </div>
            );
          }}
        />
      </CardContent>
    </Card>
  );
}
