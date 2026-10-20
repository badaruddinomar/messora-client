"use client";

import { useState } from "react";
import {
  Bolt,
  Brush,
  ChefHat,
  Droplet,
  Flame,
  Hammer,
  Home,
  ReceiptText,
  Sparkles,
  UtensilsCrossed,
  Wifi,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { MoneyText } from "@/components/common/money-text";
import { ResponsiveDialog } from "@/components/common/responsive-dialog";
import { StatCard, StatCardSkeleton } from "@/components/common/stat-card";
import { UserAvatar } from "@/components/common/user-avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentMess } from "@/features/messes/mess-context";
import { getErrorMessage } from "@/lib/api-error";
import { formatDate, formatDay, formatMoney } from "@/lib/format";
import {
  useDeleteExpenseMutation,
  useExpenseQuery,
  useExpenseSummaryQuery,
  useExpensesInfiniteQuery,
} from "../expenses-api";
import { CATEGORY_LABELS, SPLIT_LABELS, type Expense, type ExpenseCategory } from "../expenses-types";
import { ExpenseFormDialog } from "./expense-form-dialog";

export const CATEGORY_ICONS: Record<ExpenseCategory, LucideIcon> = {
  ELECTRICITY: Bolt,
  GAS: Flame,
  WATER: Droplet,
  INTERNET: Wifi,
  COOK_SALARY: ChefHat,
  MAID_SALARY: Sparkles,
  CLEANING: Brush,
  MAINTENANCE: Hammer,
  HOUSE_RENT: Home,
  UTENSILS: UtensilsCrossed,
  OTHER: ReceiptText,
};

/** This month's shared costs: totals, your share, a breakdown by category and the list. */
export function ExpensesTab({ monthId }: { monthId: string | undefined }) {
  return (
    <div className="grid gap-4">
      <ExpenseSummaryCards monthId={monthId} />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        {monthId ? <ExpenseList monthId={monthId} /> : <Skeleton className="h-64 rounded-xl" />}
        <CategoryBreakdown monthId={monthId} />
      </div>
    </div>
  );
}

function ExpenseSummaryCards({ monthId }: { monthId: string | undefined }) {
  const mess = useCurrentMess();
  const { data } = useExpenseSummaryQuery({ messId: mess.id, monthId }, { skip: !monthId });
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
        label="Shared costs this month"
        icon={ReceiptText}
        value={<MoneyText value={data.total} compact />}
        helper={data.count === 1 ? "1 expense" : `${data.count} expenses`}
      />
      <StatCard
        label="Your share"
        value={<MoneyText value={data.yourShare} compact />}
        helper="So far this month"
      />
      <StatCard
        label="From the mess fund"
        value={<MoneyText value={data.byPaidFrom.MESS_FUND} compact />}
        helper={
          <>
            Paid by members <MoneyText value={data.byPaidFrom.OWN_POCKET} compact />
          </>
        }
      />
    </div>
  );
}

/** Where the money went: each category's share of the month's costs as a bar. */
function CategoryBreakdown({ monthId }: { monthId: string | undefined }) {
  const mess = useCurrentMess();
  const { data } = useExpenseSummaryQuery({ messId: mess.id, monthId }, { skip: !monthId });
  const max = data ? Math.max(...data.byCategory.map((c) => Number(c.total)), 1) : 1;

  return (
    <Card>
      <CardHeader>
        <CardTitle>By category</CardTitle>
        <CardDescription>Where this month&apos;s shared costs went.</CardDescription>
      </CardHeader>
      <CardContent>
        {!data ? (
          <Skeleton className="h-28 rounded-lg" />
        ) : data.byCategory.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing yet.</p>
        ) : (
          <ul className="grid gap-3">
            {data.byCategory.map((c) => {
              const Icon = CATEGORY_ICONS[c.category];
              const share = Math.round((Number(c.total) / Number(data.total)) * 100);
              return (
                <li key={c.category} className="grid gap-1.5">
                  <div className="flex items-center gap-2 text-sm">
                    <Icon className="size-4 text-muted-foreground" aria-hidden />
                    <span className="min-w-0 flex-1 truncate">{CATEGORY_LABELS[c.category]}</span>
                    <MoneyText value={c.total} compact className="font-medium" />
                  </div>
                  <div
                    className="h-1.5 overflow-hidden rounded-full bg-muted"
                    role="img"
                    aria-label={`${share}% of the month's shared costs`}
                  >
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${(Number(c.total) / max) * 100}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function ExpenseList({ monthId }: { monthId: string }) {
  const mess = useCurrentMess();
  const query = useExpensesInfiniteQuery({ messId: mess.id, monthId });
  const [openId, setOpenId] = useState<string | null>(null);
  const expenses = query.data?.pages.flatMap((p) => p.items) ?? [];

  if (query.error)
    return <ErrorState error={query.error} onRetry={query.refetch} retrying={query.isFetching} />;
  if (query.isLoading || !query.data) return <Skeleton className="h-64 rounded-xl" />;
  if (expenses.length === 0) {
    return (
      <EmptyState
        icon={ReceiptText}
        title="No shared costs this month"
        description="Bills, rent and salaries go here, split between members."
      />
    );
  }
  return (
    <div className="grid gap-3">
      <Card className="gap-0 py-0">
        <ul className="divide-y">
          {expenses.map((e) => (
            <ExpenseRow key={e.id} expense={e} onOpen={() => setOpenId(e.id)} />
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
      {openId && <ExpenseDetailDialog expenseId={openId} onClose={() => setOpenId(null)} />}
    </div>
  );
}

function ExpenseRow({ expense, onOpen }: { expense: Expense; onOpen: () => void }) {
  const Icon = CATEGORY_ICONS[expense.category];
  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors duration-150 outline-none hover:bg-muted/40 focus-visible:bg-muted/40 sm:px-6"
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
          <Icon className="size-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{expense.title}</p>
          <p className="truncate text-xs text-muted-foreground">
            {formatDay(expense.billDate)} · {SPLIT_LABELS[expense.splitType].toLowerCase()}
            {expense.paidBy && ` · paid by ${expense.paidBy.name}`}
          </p>
        </div>
        <div className="flex flex-col items-end">
          <MoneyText value={expense.amount} className="font-semibold" />
          <span className="text-xs text-muted-foreground">You: {formatMoney(expense.yourShare)}</span>
        </div>
      </button>
    </li>
  );
}

function ExpenseDetailDialog({ expenseId, onClose }: { expenseId: string; onClose: () => void }) {
  const mess = useCurrentMess();
  const { data: expense, isLoading } = useExpenseQuery({ messId: mess.id, expenseId });
  const [deleteExpense] = useDeleteExpenseMutation();
  const [deleting, setDeleting] = useState(false);

  const onDelete = async () => {
    const res = await deleteExpense({ messId: mess.id, expenseId });
    if (res.error) {
      toast.error(getErrorMessage(res.error));
      throw res.error;
    }
    toast.success("Expense deleted");
    onClose();
  };

  return (
    <ResponsiveDialog
      open
      onOpenChange={(o) => !o && onClose()}
      title={expense ? <MoneyText value={expense.amount} className="text-xl" /> : "Expense"}
      description={expense && `${expense.title} · ${formatDate(expense.billDate, "d MMM yyyy")}`}
      className="max-h-[90svh] overflow-y-auto sm:max-w-lg"
    >
      {isLoading || !expense ? (
        <Skeleton className="h-40" />
      ) : (
        <div className="grid gap-5">
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-xs text-muted-foreground">Category</dt>
              <dd className="font-medium">{CATEGORY_LABELS[expense.category]}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Paid from</dt>
              <dd className="font-medium">
                {expense.paidBy ? `${expense.paidBy.name}'s pocket` : "Mess fund"}
              </dd>
            </div>
          </dl>
          <div className="grid gap-2">
            <p className="text-xs font-medium text-muted-foreground">
              Split {SPLIT_LABELS[expense.splitType].toLowerCase()}
            </p>
            <ul className="grid gap-1.5 rounded-lg border p-3">
              {expense.shares.map((s) => (
                <li key={s.member.id} className="flex items-center gap-2 text-sm">
                  <UserAvatar name={s.member.name} src={s.member.avatarUrl} size="sm" className="size-6" />
                  <span className="min-w-0 flex-1 truncate">
                    {s.member.id === mess.membership.id ? "You" : s.member.name}
                  </span>
                  <MoneyText value={s.amount} className="font-medium" />
                </li>
              ))}
            </ul>
          </div>
          {expense.receiptUrl && (
            <a
              href={expense.receiptUrl}
              target="_blank"
              rel="noreferrer"
              className="block overflow-hidden rounded-lg border"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- short-lived signed URL */}
              <img
                src={expense.receiptUrl}
                alt="Receipt"
                className="max-h-64 w-full bg-muted object-contain"
              />
            </a>
          )}
          {expense.canEdit && (
            <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end">
              <Button
                variant="ghost"
                className="text-destructive sm:mr-auto"
                onClick={() => setDeleting(true)}
              >
                Delete
              </Button>
              <ExpenseFormDialog
                expense={expense}
                trigger={(open) => (
                  <Button variant="outline" onClick={open}>
                    Edit
                  </Button>
                )}
              />
            </div>
          )}
          <ConfirmDialog
            open={deleting}
            onOpenChange={setDeleting}
            title="Delete this expense?"
            description="It's taken out of everyone's shared costs for the month."
            confirmLabel="Delete expense"
            destructive
            onConfirm={onDelete}
          />
        </div>
      )}
    </ResponsiveDialog>
  );
}
