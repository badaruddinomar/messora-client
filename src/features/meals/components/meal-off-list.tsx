"use client";

import { useState } from "react";
import { CalendarOff, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentMess } from "@/features/messes/mess-context";
import { getErrorMessage } from "@/lib/api-error";
import { todayIn } from "@/lib/date";
import { formatDate } from "@/lib/format";
import { useDeleteMealOffMutation, useMealOffPeriodsQuery } from "../meals-api";
import type { MealOffPeriod } from "../meals-types";
import { MealOffDialog } from "./meal-off-dialog";

export function formatRange(from: string, to: string) {
  if (from === to) return formatDate(from, "EEE, d MMM");
  return `${formatDate(from, "d MMM")} – ${formatDate(to, "d MMM")}`;
}

/** Upcoming and running meal-offs: the caller's own, or everyone's (managers). */
export function MealOffList({ everyone = false }: { everyone?: boolean }) {
  const mess = useCurrentMess();
  const { data: periods, isLoading } = useMealOffPeriodsQuery({
    messId: mess.id,
    ...(!everyone && { memberId: mess.membership.id }),
  });

  return (
    <Card className="gap-4">
      <CardHeader>
        <CardTitle>{everyone ? "Meal-offs" : "Your meal-offs"}</CardTitle>
        <CardDescription>
          {everyone ? "Who's away, and when." : "Days your meals are turned off."}
        </CardDescription>
        <CardAction>
          <MealOffDialog
            trigger={(open) => (
              <Button variant="outline" size="sm" onClick={open}>
                <Plus />
                Add
              </Button>
            )}
          />
        </CardAction>
      </CardHeader>
      <CardContent>
        {isLoading || !periods ? (
          <Skeleton className="h-12 rounded-lg" />
        ) : periods.length === 0 ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarOff className="size-4" aria-hidden />
            None planned
          </p>
        ) : (
          <ul className="grid gap-2">
            {periods.map((p) => (
              <MealOffRow key={p.id} period={p} showName={everyone} />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function MealOffRow({ period, showName }: { period: MealOffPeriod; showName: boolean }) {
  const mess = useCurrentMess();
  const [deleteMealOff] = useDeleteMealOffMutation();
  const [confirming, setConfirming] = useState(false);
  const running = period.fromDate <= todayIn(mess.timezone);

  const onConfirm = async () => {
    const res = await deleteMealOff({ messId: mess.id, periodId: period.id });
    if (res.error) {
      toast.error(getErrorMessage(res.error));
      throw res.error;
    }
    toast.success(res.data.ended ? "Meal-off ended" : "Meal-off cancelled", {
      description: "Upcoming meals are back to your usual.",
    });
  };

  return (
    <li className="flex items-center gap-3 rounded-lg border bg-muted/20 px-3 py-2">
      <div className="min-w-0 flex-1 text-sm">
        <p className="font-medium">
          {showName && <span>{period.member.name} · </span>}
          {formatRange(period.fromDate, period.toDate)}
        </p>
        {period.reason && <p className="truncate text-muted-foreground">{period.reason}</p>}
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="size-8 text-muted-foreground"
        aria-label={running ? "End meal-off" : "Cancel meal-off"}
        onClick={() => setConfirming(true)}
      >
        <X />
      </Button>
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={running ? "End this meal-off?" : "Cancel this meal-off?"}
        description={
          running
            ? "Days already off stay off. From now on, meals go back to the usual."
            : "Those days go back to the usual meals."
        }
        confirmLabel={running ? "End meal-off" : "Cancel meal-off"}
        cancelLabel="Keep it"
        onConfirm={onConfirm}
      />
    </li>
  );
}
