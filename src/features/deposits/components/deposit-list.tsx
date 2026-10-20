"use client";

import { useState } from "react";
import { parseAsString, parseAsStringLiteral, useQueryStates } from "nuqs";
import { FilterX, Wallet } from "lucide-react";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { MoneyText } from "@/components/common/money-text";
import { StatusBadge } from "@/components/common/status-badge";
import { UserAvatar } from "@/components/common/user-avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useMembersQuery } from "@/features/members/members-api";
import { useCurrentMess, useMessPermissions } from "@/features/messes/mess-context";
import { MonthPicker } from "@/features/months/components/month-picker";
import type { Month } from "@/features/months/months-types";
import { formatDay } from "@/lib/format";
import { useDepositsInfiniteQuery } from "../deposits-api";
import { methodLabel, PAYMENT_METHODS, type Deposit, type DepositFilters } from "../deposits-types";
import { DepositDetailDialog } from "./deposit-detail-dialog";

const ALL = "all";
const STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const;
const METHODS = ["CASH", "BKASH", "NAGAD", "ROCKET", "BANK", "OTHER"] as const;

export function DepositRow({
  deposit,
  showMember,
  onOpen,
}: {
  deposit: Deposit;
  showMember: boolean;
  onOpen: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors duration-150 outline-none hover:bg-muted/40 focus-visible:bg-muted/40 sm:px-6"
      >
        {showMember && <UserAvatar name={deposit.member.name} src={deposit.member.avatarUrl} size="sm" />}
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 text-sm">
            <span className="truncate font-medium">
              {showMember ? deposit.member.name : methodLabel(deposit.method)}
            </span>
            <span className="shrink-0 text-muted-foreground">· {formatDay(deposit.date)}</span>
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {showMember && methodLabel(deposit.method)}
            {deposit.transactionRef && `${showMember ? " · " : ""}${deposit.transactionRef}`}
            {!showMember && !deposit.transactionRef && (deposit.note ?? "")}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <MoneyText value={deposit.amount} className="font-semibold" />
          {deposit.status !== "APPROVED" && <StatusBadge status={deposit.status} />}
        </div>
      </button>
    </li>
  );
}

/** The month's deposits: your own, or everyone's for managers (with filters in the URL). */
export function DepositList({ month }: { month: Month | undefined }) {
  const mess = useCurrentMess();
  const { canManage } = useMessPermissions();
  const { data: members } = useMembersQuery({ messId: mess.id }, { skip: !canManage });
  const [filters, setFilters] = useQueryStates({
    status: parseAsStringLiteral(STATUSES),
    member: parseAsString,
    method: parseAsStringLiteral(METHODS),
  });
  const active = Object.values(filters).filter(Boolean).length;

  const args: { messId: string } & DepositFilters = {
    messId: mess.id,
    monthId: month?.id,
    ...(filters.status && { status: filters.status }),
    ...(filters.member && canManage && { memberId: filters.member }),
    ...(filters.method && { method: filters.method }),
  };

  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        <MonthPicker className="col-span-2" />
        <Select
          value={filters.status ?? ALL}
          onValueChange={(v) => setFilters({ status: v === ALL ? null : (v as (typeof STATUSES)[number]) })}
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
          value={filters.method ?? ALL}
          onValueChange={(v) => setFilters({ method: v === ALL ? null : (v as (typeof METHODS)[number]) })}
        >
          <SelectTrigger className="w-full sm:w-36" aria-label="Paid by">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Any method</SelectItem>
            {PAYMENT_METHODS.map((m) => (
              <SelectItem key={m.value} value={m.value}>
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {canManage && (
          <Select
            value={filters.member ?? ALL}
            onValueChange={(v) => setFilters({ member: v === ALL ? null : v })}
          >
            <SelectTrigger className="col-span-2 w-full sm:w-44" aria-label="Member">
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
        )}
        {active > 0 && (
          <Button
            variant="ghost"
            className="col-span-2 justify-self-start"
            onClick={() => setFilters({ status: null, member: null, method: null })}
          >
            <FilterX />
            Clear filters
          </Button>
        )}
      </div>
      {month ? (
        <DepositResults args={args} filtered={active > 0} showMember={canManage} />
      ) : (
        <Skeleton className="h-48 rounded-xl" />
      )}
    </div>
  );
}

function DepositResults({
  args,
  filtered,
  showMember,
}: {
  args: { messId: string } & DepositFilters;
  filtered: boolean;
  showMember: boolean;
}) {
  const query = useDepositsInfiniteQuery(args);
  const [openId, setOpenId] = useState<string | null>(null);
  const deposits = query.data?.pages.flatMap((p) => p.items) ?? [];
  const open = deposits.find((d) => d.id === openId);

  if (query.error)
    return <ErrorState error={query.error} onRetry={query.refetch} retrying={query.isFetching} />;
  if (query.isLoading || !query.data) return <Skeleton className="h-48 rounded-xl" />;
  if (deposits.length === 0) {
    return (
      <EmptyState
        icon={Wallet}
        title={filtered ? "No deposits match these filters" : "No deposits this month"}
        description={
          filtered ? "Try another status or method." : "Deposits count toward each member's balance."
        }
      />
    );
  }
  return (
    <>
      <Card className="gap-0 py-0">
        <ul className="divide-y">
          {deposits.map((d) => (
            <DepositRow key={d.id} deposit={d} showMember={showMember} onOpen={() => setOpenId(d.id)} />
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
      {open && <DepositDetailDialog deposit={open} open onOpenChange={(o) => !o && setOpenId(null)} />}
    </>
  );
}
