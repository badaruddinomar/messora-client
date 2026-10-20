"use client";

import { useState } from "react";
import { CalendarClock, CalendarRange, Info, UserRound } from "lucide-react";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { PageHeader } from "@/components/common/page-header";
import { UserAvatar } from "@/components/common/user-avatar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentMess, useMessPermissions } from "@/features/messes/mess-context";
import { formatStartDay } from "@/features/messes/utils";
import { cn } from "@/lib/cn";
import { useMonthsQuery } from "../months-api";
import type { Month } from "../months-types";
import { daysLeft, formatPeriod, monthLabel, monthProgress } from "../utils";
import { MonthManagerDialog } from "./month-manager-dialog";
import { MonthSummary } from "./month-summary";
import { MonthStatusBadge } from "./month-status-badge";

export function MonthsPage() {
  const mess = useCurrentMess();
  const { data: months, isLoading, error, refetch, isFetching } = useMonthsQuery(mess.id);

  const current = months?.find((m) => m.isCurrent);
  const waiting = months?.filter((m) => m.hasEnded && m.status !== "CLOSED") ?? [];
  const history = months?.filter((m) => !m.isCurrent) ?? [];

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Months"
        description={`Billing months for ${mess.name}. A new month opens on the ${formatStartDay(mess.monthStartDay)}.`}
      />

      {error ? (
        <ErrorState error={error} onRetry={refetch} retrying={isFetching} />
      ) : isLoading ? (
        <>
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
        </>
      ) : (
        <>
          {current && <CurrentMonthCard month={current} />}
          {current && <MonthSummary month={current} />}

          {waiting.length > 0 && (
            <Alert variant="warning">
              <CalendarClock />
              <AlertTitle>
                {waiting.length === 1
                  ? `${monthLabel(waiting[0])} has ended`
                  : `${waiting.length} months have ended`}
              </AlertTitle>
              <AlertDescription className="text-current/80">
                You can still add late bazar and deposits to {waiting.length === 1 ? "it" : "them"}. Close{" "}
                {waiting.length === 1 ? "it" : "them, oldest first,"} once everything is in, so the bills are
                final. Closing comes with month summaries in an upcoming update.
              </AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Previous months</CardTitle>
              <CardDescription>Closed months are final; their bills don&apos;t change.</CardDescription>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <EmptyState
                  icon={CalendarRange}
                  title="This is your first month"
                  description="Past months show up here, with their status and manager."
                  className="border-0 py-6"
                />
              ) : (
                <ul className="divide-y">
                  {history.map((m) => (
                    <MonthRow key={m.id} month={m} />
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <p className="flex items-start gap-2 text-xs text-muted-foreground">
            <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            Months open by themselves. A month that has ended stays open until it&apos;s closed, so late
            entries still count in the right month.
          </p>
        </>
      )}
    </div>
  );
}

function CurrentMonthCard({ month }: { month: Month }) {
  const left = daysLeft(month);
  const progress = Math.round(monthProgress(month) * 100);

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardDescription>This month</CardDescription>
        <CardTitle className="text-2xl tracking-tight">{monthLabel(month)}</CardTitle>
        <CardAction>
          <MonthStatusBadge month={month} />
        </CardAction>
      </CardHeader>
      <CardContent className="grid gap-5">
        <div className="grid gap-2">
          <div className="flex items-baseline justify-between text-sm">
            <span className="text-muted-foreground">{formatPeriod(month)}</span>
            <span className="tabular font-medium">
              {left} {left === 1 ? "day" : "days"} left
            </span>
          </div>
          <Progress value={progress} aria-label={`${progress}% of the month has passed`} />
        </div>
        <ManagerLine month={month} />
      </CardContent>
    </Card>
  );
}

function MonthRow({ month }: { month: Month }) {
  return (
    <li className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium">{monthLabel(month)}</p>
          <MonthStatusBadge month={month} />
        </div>
        <p className="text-sm text-muted-foreground">{formatPeriod(month)}</p>
      </div>
      <ManagerLine month={month} compact />
    </li>
  );
}

/** Who manages the month, with a "Change" action for admins (until it's closed). */
function ManagerLine({ month, compact = false }: { month: Month; compact?: boolean }) {
  const { isAdmin } = useMessPermissions();
  const [open, setOpen] = useState(false);
  const canEdit = isAdmin && month.status !== "CLOSED";

  return (
    <div className={cn("flex items-center gap-3", !compact && "rounded-lg border bg-muted/30 p-3")}>
      {month.manager ? (
        <UserAvatar name={month.manager.name} src={month.manager.avatarUrl} size="sm" />
      ) : (
        <span className="flex size-7 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <UserRound className="size-3.5" aria-hidden />
        </span>
      )}
      <div className="min-w-0 flex-1 text-sm">
        {!compact && <p className="text-xs text-muted-foreground">Month manager</p>}
        <p className={cn("truncate", month.manager ? "font-medium" : "text-muted-foreground")}>
          {month.manager?.name ?? "No month manager"}
        </p>
      </div>
      {canEdit && (
        <>
          <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
            {month.manager ? "Change" : "Assign"}
          </Button>
          {open && <MonthManagerDialog month={month} open={open} onOpenChange={setOpen} />}
        </>
      )}
    </div>
  );
}
