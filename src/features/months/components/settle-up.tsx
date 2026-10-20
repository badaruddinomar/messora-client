"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCheck, HandCoins, Info } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { MoneyInput } from "@/components/common/money-input";
import { MoneyText } from "@/components/common/money-text";
import { ResponsiveDialog } from "@/components/common/responsive-dialog";
import { StatCard } from "@/components/common/stat-card";
import { UserAvatar } from "@/components/common/user-avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { messRoutes } from "@/constants/routes";
import { PAYMENT_METHODS, methodLabel } from "@/features/deposits/deposits-types";
import { useCurrentMess, useMessPermissions } from "@/features/messes/mess-context";
import { getErrorMessage } from "@/lib/api-error";
import { formatDate, formatMoney } from "@/lib/format";
import { isMoney } from "@/lib/money";
import { useRecordSettlementMutation, useSettlementsQuery } from "../months-api";
import type { Month, PaymentMethod, SettlementRow } from "../months-types";
import { monthLabel } from "../utils";

/** Who still owes the mess and who's owed a refund from a closed month, and recording payments. */
export function SettleUp({ month }: { month: Month }) {
  const mess = useCurrentMess();
  const { canManage } = useMessPermissions();
  const { data, isLoading, error, refetch, isFetching } = useSettlementsQuery({
    messId: mess.id,
    monthId: month.id,
  });
  const [filter, setFilter] = useState<"unsettled" | "all">("unsettled");
  const [paying, setPaying] = useState<SettlementRow | null>(null);

  if (error) return <ErrorState error={error} onRetry={refetch} retrying={isFetching} />;
  if (isLoading || !data) return <Skeleton className="h-64 rounded-xl" />;
  const rows = data.rows.filter((r) => filter === "all" || (!r.isSettled && r.direction));

  return (
    <div className="grid gap-4">
      {canManage && (
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            label="Still to collect"
            value={<MoneyText value={data.totals.dueToMess} compact />}
            helper="Dues members owe"
          />
          <StatCard
            label="Still to refund"
            value={<MoneyText value={data.totals.owedToMembers} compact />}
            helper="Credit the mess owes"
          />
        </div>
      )}
      {!data.collectable && (
        <Alert>
          <Info />
          <AlertDescription>
            The month after {monthLabel(month)} is closed too, so what&apos;s left here carried into its bill.
          </AlertDescription>
        </Alert>
      )}
      {canManage && (
        <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <TabsList>
            <TabsTrigger value="unsettled">To settle</TabsTrigger>
            <TabsTrigger value="all">Everyone</TabsTrigger>
          </TabsList>
        </Tabs>
      )}
      {rows.length === 0 ? (
        <EmptyState
          icon={CheckCheck}
          title="All settled"
          description={`Every ${monthLabel(month)} balance is paid.`}
        />
      ) : (
        <Card className="gap-0 py-0">
          <ul className="divide-y">
            {rows.map((r) => (
              <li
                key={r.summaryId}
                className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:px-6"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <UserAvatar name={r.member.name} src={r.member.avatarUrl} size="sm" />
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-sm font-medium">
                      <Link
                        href={messRoutes(mess.slug).bill(month.id, r.member.id)}
                        className="truncate hover:underline"
                      >
                        {r.member.name}
                      </Link>
                      {r.isSettled && r.direction && <Badge variant="success">Settled</Badge>}
                      {r.carriedOver && <Badge variant="muted">Carried over</Badge>}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {r.direction === "MEMBER_TO_MESS"
                        ? "Owes the mess"
                        : r.direction === "MESS_TO_MEMBER"
                          ? "The mess owes them"
                          : "Nothing to settle"}
                      {Number(r.settledAmount) > 0 && ` · ${formatMoney(r.settledAmount)} paid`}
                      {r.payments.length > 0 &&
                        ` · last ${formatDate(r.payments[r.payments.length - 1].paidAt, "d MMM")} by ${methodLabel(r.payments[r.payments.length - 1].method)}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3 sm:justify-end">
                  <MoneyText value={r.closingBalance} variant="balance" className="font-semibold" />
                  {canManage && data.collectable && !r.isSettled && r.direction && (
                    <Button size="sm" variant="outline" onClick={() => setPaying(r)}>
                      <HandCoins />
                      {r.direction === "MEMBER_TO_MESS" ? "Record payment" : "Record refund"}
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
      {paying && <PaymentDialog month={month} row={paying} onClose={() => setPaying(null)} />}
    </div>
  );
}

function PaymentDialog({ month, row, onClose }: { month: Month; row: SettlementRow; onClose: () => void }) {
  const mess = useCurrentMess();
  const [record, { isLoading }] = useRecordSettlementMutation();
  const [amount, setAmount] = useState(row.remaining);
  const [method, setMethod] = useState<PaymentMethod>("CASH");
  const [ref, setRef] = useState("");
  const [error, setError] = useState<string>();
  const due = row.direction === "MEMBER_TO_MESS";

  const submit = async () => {
    if (!isMoney(amount) || Number(amount) <= 0) return setError("Enter the amount");
    const res = await record({
      messId: mess.id,
      monthId: month.id,
      memberId: row.member.id,
      amount,
      method,
      transactionRef: method === "CASH" ? null : ref || null,
    });
    if (res.error) return setError(getErrorMessage(res.error));
    toast.success(res.data.isSettled ? `${row.member.name} is settled` : "Payment recorded", {
      description: res.data.isSettled ? undefined : `${formatMoney(res.data.remaining)} left`,
    });
    onClose();
  };

  return (
    <ResponsiveDialog
      open
      onOpenChange={(o) => !o && onClose()}
      title={due ? `${row.member.name} paid` : `Refund ${row.member.name}`}
      description={`${formatMoney(row.remaining)} left of their ${monthLabel(month)} ${due ? "due" : "credit"}.`}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} loading={isLoading}>
            {due ? "Record payment" : "Record refund"}
          </Button>
        </>
      }
    >
      <div className="grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="settle-amount">Amount</Label>
            <MoneyInput id="settle-amount" value={amount} onChange={setAmount} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="settle-method">Paid by</Label>
            <Select value={method} onValueChange={(v) => setMethod(v as PaymentMethod)}>
              <SelectTrigger id="settle-method" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        {method !== "CASH" && (
          <div className="grid gap-2">
            <Label htmlFor="settle-ref">
              Transaction ID <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Input id="settle-ref" value={ref} onChange={(e) => setRef(e.target.value)} />
          </div>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    </ResponsiveDialog>
  );
}
