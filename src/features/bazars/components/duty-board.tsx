"use client";

import { useState } from "react";
import { CalendarClock, Check, MoreHorizontal, Plus, Repeat } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { UserAvatar } from "@/components/common/user-avatar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentMess, useMessPermissions } from "@/features/messes/mess-context";
import { MonthPicker } from "@/features/months/components/month-picker";
import type { Month } from "@/features/months/months-types";
import { isMonthEditable } from "@/features/months/utils";
import { relativeDayLabel } from "@/features/meals/components/day-navigator";
import { getErrorMessage } from "@/lib/api-error";
import { cn } from "@/lib/cn";
import { todayIn } from "@/lib/date";
import { formatDate } from "@/lib/format";
import { useBazarDutiesQuery, useRemoveDutyMutation, useUpdateDutyMutation } from "../bazars-api";
import type { BazarDuty } from "../bazars-types";
import { DutyActionDialog, type DutyAction } from "./duty-action-dialog";
import { PlanRotationDialog } from "./plan-rotation-dialog";

/** Who does the bazar on which day this month. */
export function DutyBoard({ month }: { month: Month | undefined }) {
  const mess = useCurrentMess();
  const { canManage } = useMessPermissions();
  const { data, isLoading, error, refetch, isFetching } = useBazarDutiesQuery(
    { messId: mess.id, monthId: month?.id },
    { skip: !month },
  );
  const [action, setAction] = useState<DutyAction | null>(null);
  const today = todayIn(mess.timezone);
  const editable = !!month && isMonthEditable(month) && canManage;

  const duties = data?.duties ?? [];
  const next = duties.find((d) => d.member.id === mess.membership.id && !d.isDone && d.date >= today);
  // Grouped by hand: Map.groupBy is too new for many phones' browsers.
  const byDate = new Map<string, BazarDuty[]>();
  for (const duty of duties) byDate.set(duty.date, [...(byDate.get(duty.date) ?? []), duty]);

  return (
    <div className="grid gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <MonthPicker />
        {editable && month && (
          <div className="flex gap-2 sm:ml-auto">
            <Button variant="outline" onClick={() => setAction({ kind: "add" })}>
              <Plus />
              Add duty
            </Button>
            <PlanRotationDialog
              month={month}
              trigger={(open) => (
                <Button onClick={open}>
                  <Repeat />
                  Plan rotation
                </Button>
              )}
            />
          </div>
        )}
      </div>

      {next && (
        <Alert variant={next.date === today ? "warning" : "default"}>
          <CalendarClock />
          <AlertTitle>
            {next.date === today
              ? "You're on bazar duty today"
              : `Your next bazar duty: ${formatDate(next.date, "EEEE, d MMM")}`}
          </AlertTitle>
          <AlertDescription>Adding your bazar ticks it off automatically.</AlertDescription>
        </Alert>
      )}

      {error ? (
        <ErrorState error={error} onRetry={refetch} retrying={isFetching} />
      ) : isLoading || !data ? (
        <Skeleton className="h-64 rounded-xl" />
      ) : duties.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title="No bazar duty planned"
          description={
            canManage
              ? "Plan a rotation so everyone knows their bazar days."
              : "A manager can plan who shops when."
          }
        />
      ) : (
        <Card className="gap-0 py-0">
          <ol className="divide-y">
            {[...byDate.entries()].map(([date, dayDuties]) => (
              <li
                key={date}
                className={cn(
                  "flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:px-6",
                  date < today && "bg-muted/20",
                  date === today && "bg-primary/[0.04]",
                )}
              >
                <div className="w-36 shrink-0">
                  <p className={cn("text-sm font-medium", date === today && "text-primary")}>
                    {relativeDayLabel(date, today)}
                  </p>
                  <p className="text-xs text-muted-foreground">{formatDate(date, "d MMM")}</p>
                </div>
                <ul className="flex flex-1 flex-wrap gap-2">
                  {dayDuties.map((duty) => (
                    <DutyChip
                      key={duty.id}
                      duty={duty}
                      today={today}
                      editable={editable}
                      canTick={
                        (editable || duty.member.id === mess.membership.id) &&
                        !!month &&
                        isMonthEditable(month)
                      }
                      onAction={setAction}
                    />
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </Card>
      )}

      {action && month && (
        <DutyActionDialog action={action} month={month} duties={duties} onClose={() => setAction(null)} />
      )}
    </div>
  );
}

function DutyChip({
  duty,
  today,
  editable,
  canTick,
  onAction,
}: {
  duty: BazarDuty;
  today: string;
  editable: boolean;
  canTick: boolean;
  onAction: (action: DutyAction) => void;
}) {
  const mess = useCurrentMess();
  const [updateDuty, { isLoading }] = useUpdateDutyMutation();
  const [removeDuty] = useRemoveDutyMutation();
  const mine = duty.member.id === mess.membership.id;

  const tick = async (isDone: boolean) => {
    const res = await updateDuty({ messId: mess.id, dutyId: duty.id, isDone });
    if (res.error) toast.error(getErrorMessage(res.error));
  };
  const remove = async () => {
    const res = await removeDuty({ messId: mess.id, dutyId: duty.id });
    if (res.error) return toast.error(getErrorMessage(res.error));
    toast.success("Bazar duty removed");
  };

  return (
    <li
      className={cn(
        "flex items-center gap-2 rounded-full border py-1 pr-1 pl-1 text-sm",
        duty.isDone ? "border-success/30 bg-success/10" : mine ? "border-primary/40" : "bg-card",
      )}
    >
      <UserAvatar name={duty.member.name} src={duty.member.avatarUrl} size="sm" className="size-6" />
      <span className={cn("font-medium", duty.isDone && "text-muted-foreground")}>
        {mine ? "You" : duty.member.name}
      </span>
      {duty.isDone ? (
        <Check className="mr-1 size-4 text-success" aria-label="Done" />
      ) : (
        canTick &&
        duty.date <= today && (
          <Button
            size="sm"
            variant="outline"
            className="h-7 rounded-full px-2.5 text-xs"
            loading={isLoading}
            onClick={() => tick(true)}
          >
            Mark done
          </Button>
        )
      )}
      {(editable || (canTick && duty.isDone)) && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-7 rounded-full"
              aria-label={`Options for ${duty.member.name}'s duty`}
            >
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {duty.isDone && <DropdownMenuItem onSelect={() => tick(false)}>Not done yet</DropdownMenuItem>}
            {editable && !duty.isDone && (
              <>
                <DropdownMenuItem onSelect={() => onAction({ kind: "move", duty })}>
                  Move to another day
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => onAction({ kind: "reassign", duty })}>
                  Give to someone else
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => onAction({ kind: "swap", duty })}>
                  Swap with…
                </DropdownMenuItem>
              </>
            )}
            {editable && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onSelect={remove}>
                  Remove
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </li>
  );
}
