"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, CircleAlert, CircleCheck, CircleX, PartyPopper } from "lucide-react";
import { toast } from "sonner";
import { MoneyText } from "@/components/common/money-text";
import { ResponsiveDialog } from "@/components/common/responsive-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { messRoutes } from "@/constants/routes";
import { useCurrentMess, useMessPermissions } from "@/features/messes/mess-context";
import { getErrorMessage } from "@/lib/api-error";
import { cn } from "@/lib/cn";
import { formatMoney, formatSignedMoney } from "@/lib/format";
import {
  useCloseCheckQuery,
  useCloseMonthMutation,
  useMonthPreviewQuery,
  useReopenMonthMutation,
  useStartClosingMutation,
} from "../months-api";
import type { Month } from "../months-types";
import { monthLabel } from "../utils";

/**
 * Closing a month, step by step (BUSINESS_RULES §3, §8): check nothing is missing → start closing
 * (locks the month) → check everyone's final balance → close → done.
 */
export function CloseMonthDialog({
  month,
  trigger,
}: {
  month: Month;
  trigger: (open: () => void) => ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  return (
    <>
      {trigger(() => {
        setDone(false);
        setOpen(true);
      })}
      <ResponsiveDialog
        open={open}
        onOpenChange={setOpen}
        title={done ? `${monthLabel(month)} is closed` : `Close ${monthLabel(month)}`}
        description={
          done
            ? "Everyone has their final bill. Now settle dues and refunds, and hand over the cash."
            : "Closing makes this month's bill final. It can't be changed afterwards."
        }
        className="max-h-[90svh] overflow-y-auto sm:max-w-lg"
      >
        {open &&
          (done ? (
            <Done month={month} onClose={() => setOpen(false)} />
          ) : (
            <Steps month={month} onClosed={() => setDone(true)} />
          ))}
      </ResponsiveDialog>
    </>
  );
}

function Steps({ month, onClosed }: { month: Month; onClosed: () => void }) {
  const mess = useCurrentMess();
  const { isAdmin } = useMessPermissions();
  const routes = messRoutes(mess.slug);
  const { data: check, isLoading } = useCloseCheckQuery({ messId: mess.id, monthId: month.id });
  const { data: preview } = useMonthPreviewQuery({ messId: mess.id, monthId: month.id });
  const [startClosing, starting] = useStartClosingMutation();
  const [closeMonth, closing] = useCloseMonthMutation();
  const [reopen, reopening] = useReopenMonthMutation();
  const [error, setError] = useState<string>();

  if (isLoading || !check) return <Skeleton className="h-48" />;
  const status = check.month.status;
  const pendingTotal = check.pending.bazars + check.pending.deposits;

  const onStart = async () => {
    setError(undefined);
    const res = await startClosing({ messId: mess.id, monthId: month.id });
    if (res.error) setError(getErrorMessage(res.error));
  };
  const onClose = async () => {
    setError(undefined);
    const res = await closeMonth({ messId: mess.id, monthId: month.id, version: check.month.version });
    if (res.error) return setError(getErrorMessage(res.error));
    onClosed();
  };
  const onReopen = async () => {
    const res = await reopen({ messId: mess.id, monthId: month.id });
    if (res.error) return setError(getErrorMessage(res.error));
    toast.success(`${monthLabel(month)} is open again`);
  };

  return (
    <div className="grid gap-5">
      <ol className="flex items-center gap-2 text-xs font-medium" aria-label="Steps">
        <StepPill active={status === "OPEN"} done={status !== "OPEN"} n={1} label="Check" />
        <span className="h-px flex-1 bg-border" aria-hidden />
        <StepPill active={status === "CLOSING"} done={false} n={2} label="Confirm" />
      </ol>

      {error && (
        <Alert variant="destructive">
          <CircleAlert />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {status === "OPEN" ? (
        <>
          <ul className="grid gap-2 text-sm">
            <CheckLine ok={check.ended}>
              {check.ended ? `${monthLabel(month)} has ended` : `${monthLabel(month)} hasn't ended yet`}
            </CheckLine>
            <CheckLine ok={check.earlierOpen.length === 0}>
              {check.earlierOpen.length === 0 ? (
                "Earlier months are closed"
              ) : (
                <>
                  Close {check.earlierOpen.map((m) => m.label).join(", ")} first{" "}
                  <Link href={routes.month(check.earlierOpen[0].id)} className="font-medium underline">
                    Open it
                  </Link>
                </>
              )}
            </CheckLine>
            <CheckLine ok={pendingTotal === 0}>
              {pendingTotal === 0 ? (
                "Nothing is waiting for approval"
              ) : (
                <>
                  Waiting for approval:{" "}
                  {check.pending.bazars > 0 && (
                    <Link href={`${routes.bazar}?tab=review`} className="font-medium underline">
                      {check.pending.bazars} bazar
                    </Link>
                  )}
                  {check.pending.bazars > 0 && check.pending.deposits > 0 && " and "}
                  {check.pending.deposits > 0 && (
                    <Link href={`${routes.deposits}?tab=review`} className="font-medium underline">
                      {check.pending.deposits} deposit{check.pending.deposits === 1 ? "" : "s"}
                    </Link>
                  )}
                </>
              )}
            </CheckLine>
          </ul>
          <Warnings check={check} />
          <p className="text-xs text-muted-foreground">
            Starting to close locks the month: no meal, bazar, deposit or expense in it can change. An admin
            can open it again if something is missing.
          </p>
          <Button onClick={onStart} loading={starting.isLoading} disabled={!check.canStartClosing}>
            Start closing
          </Button>
        </>
      ) : (
        <>
          <Warnings check={check} />
          {preview ? (
            <div className="grid gap-3">
              <div className="grid grid-cols-3 gap-2 text-center">
                <Figure label="Meal rate" value={formatMoney(preview.totals.mealRate)} />
                <Figure label="Bazar" value={formatMoney(preview.totals.totalBazar)} />
                <Figure label="Cash in hand" value={formatSignedMoney(preview.cash.closingCash)} />
              </div>
              <ul className="divide-y rounded-lg border">
                {preview.members.map((m) => (
                  <li key={m.member.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                    <span className="truncate">{m.member.name}</span>
                    <MoneyText value={m.closingBalance} variant="balance" className="font-medium" />
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <Skeleton className="h-40" />
          )}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            {isAdmin && (
              <Button variant="ghost" className="sm:mr-auto" onClick={onReopen} loading={reopening.isLoading}>
                Reopen month
              </Button>
            )}
            <Button onClick={onClose} loading={closing.isLoading}>
              Close {monthLabel(month)}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

function StepPill({ n, label, active, done }: { n: number; label: string; active: boolean; done: boolean }) {
  return (
    <li
      aria-current={active ? "step" : undefined}
      className={cn(
        "flex items-center gap-1.5",
        active ? "text-foreground" : done ? "text-success" : "text-muted-foreground",
      )}
    >
      <span
        className={cn(
          "flex size-5 items-center justify-center rounded-full border text-[11px]",
          active && "border-primary bg-primary text-primary-foreground",
          done && "border-success bg-success text-success-foreground",
        )}
      >
        {done ? <CheckCircle2 className="size-3.5" aria-hidden /> : n}
      </span>
      {label}
    </li>
  );
}

function CheckLine({ ok, children }: { ok: boolean; children: ReactNode }) {
  const Icon = ok ? CircleCheck : CircleX;
  return (
    <li className="flex items-start gap-2">
      <Icon
        className={cn("mt-0.5 size-4 shrink-0", ok ? "text-success" : "text-destructive")}
        aria-label={ok ? "Done" : "Not yet"}
      />
      <span>{children}</span>
    </li>
  );
}

function Warnings({
  check,
}: {
  check: { warnings: { noMealsAtAll: boolean; membersWithoutMeals: { name: string }[] } };
}) {
  const { noMealsAtAll, membersWithoutMeals } = check.warnings;
  if (!noMealsAtAll && membersWithoutMeals.length === 0) return null;
  return (
    <Alert variant="warning">
      <AlertTriangle />
      <AlertTitle>Worth a look</AlertTitle>
      <AlertDescription className="text-current/80">
        {noMealsAtAll
          ? "No meals were recorded, so the bazar will be shared equally."
          : `No meals for ${membersWithoutMeals.map((m) => m.name).join(", ")}. They pay no meal cost.`}
      </AlertDescription>
    </Alert>
  );
}

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-muted/20 px-2 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="tabular text-sm font-semibold">{value}</p>
    </div>
  );
}

function Done({ month, onClose }: { month: Month; onClose: () => void }) {
  const mess = useCurrentMess();
  return (
    <div className="grid justify-items-center gap-4 py-2 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-success/10 text-success">
        <PartyPopper className="size-6" aria-hidden />
      </span>
      <p className="text-sm text-muted-foreground">Everyone got a notification with their balance.</p>
      <div className="flex gap-2">
        <Button variant="outline" onClick={onClose}>
          Done
        </Button>
        <Button asChild onClick={onClose}>
          <Link href={`${messRoutes(mess.slug).month(month.id)}?tab=settle`}>Settle up</Link>
        </Button>
      </div>
    </div>
  );
}
