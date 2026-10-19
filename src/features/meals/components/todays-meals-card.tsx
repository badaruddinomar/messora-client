"use client";

import Link from "next/link";
import { Check, ChevronRight, Minus } from "lucide-react";
import { ErrorState } from "@/components/common/error-state";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { messRoutes } from "@/constants/routes";
import { useCurrentMess, useMessPermissions } from "@/features/messes/mess-context";
import { cn } from "@/lib/cn";
import { todayIn } from "@/lib/date";
import { formatCount } from "@/lib/format";
import { useMealDayQuery } from "../meals-api";
import { isEating, mealOf } from "../utils";

/** Overview card: today's meals for you (and the totals for the cook, for managers), plus the menu. */
export function TodaysMealsCard() {
  const mess = useCurrentMess();
  const { canManage } = useMessPermissions();
  const date = todayIn(mess.timezone);
  const { data: day, isLoading, error, refetch, isFetching } = useMealDayQuery({ messId: mess.id, date });
  const me = day?.rows.find((r) => r.member.id === day.you.memberId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Today&apos;s meals</CardTitle>
        <CardDescription>
          {canManage ? "Your meals, and how many to cook." : "What you're eating today."}
        </CardDescription>
        <CardAction>
          <Button variant="ghost" size="sm" asChild>
            <Link href={messRoutes(mess.slug).meals}>
              Open
              <ChevronRight />
            </Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        {error ? (
          <ErrorState error={error} onRetry={refetch} retrying={isFetching} />
        ) : isLoading || !day ? (
          <div className="grid gap-3">
            {Array.from({ length: 3 }, (_, i) => (
              <Skeleton key={i} className="h-10" />
            ))}
          </div>
        ) : (
          <ul className="divide-y">
            {day.slots.map((slot) => {
              const on = me ? isEating(mealOf(me, slot.id)) : false;
              return (
                <li key={slot.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                  <span
                    aria-label={on ? "You're eating" : "Off"}
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-full",
                      on ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                    )}
                  >
                    {on ? <Check className="size-4" strokeWidth={3} /> : <Minus className="size-4" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{slot.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {slot.menu?.items ?? "No menu yet"}
                    </p>
                  </div>
                  {canManage && (
                    <span className="tabular text-sm text-muted-foreground">
                      <span className="font-semibold text-foreground">
                        {formatCount(day.totals[slot.id]?.meals ?? 0)}
                      </span>
                      {Number(day.totals[slot.id]?.guests ?? 0) > 0 &&
                        ` +${formatCount(day.totals[slot.id].guests)}`}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
