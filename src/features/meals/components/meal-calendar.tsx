"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { CalendarDays, Soup, UsersRound } from "lucide-react";
import { ErrorState } from "@/components/common/error-state";
import { StatCard, StatCardSkeleton } from "@/components/common/stat-card";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useMembersQuery } from "@/features/members/members-api";
import { useCurrentMess, useMessPermissions } from "@/features/messes/mess-context";
import { MonthPicker } from "@/features/months/components/month-picker";
import { useSelectedMonth } from "@/features/months/hooks/use-selected-month";
import type { Month } from "@/features/months/months-types";
import { cn } from "@/lib/cn";
import { datesBetween, weekdayIndex } from "@/lib/date";
import { formatCount } from "@/lib/format";
import { useMealDate } from "../hooks/use-meal-date";
import { useMealSlotsQuery, useMemberMealsQuery } from "../meals-api";
import type { MemberMeals } from "../meals-types";
import { isEating } from "../utils";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** A member's meals over a billing month, day by day, with the month's totals. */
export function MealCalendar({ onOpenDay }: { onOpenDay: (date: string, memberId: string) => void }) {
  const mess = useCurrentMess();
  const { canManage } = useMessPermissions();
  const { selected: month } = useSelectedMonth();
  const [memberId, setMemberId] = useState(mess.membership.id);
  const { data: members } = useMembersQuery({ messId: mess.id }, { skip: !canManage });

  return (
    <div className="grid gap-4">
      <div className="flex flex-col gap-2 sm:flex-row">
        <MonthPicker />
        {canManage && (
          <Select value={memberId} onValueChange={setMemberId}>
            <SelectTrigger className="w-full sm:w-56" aria-label="Member">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={mess.membership.id}>Me</SelectItem>
              {members
                ?.filter((m) => m.id !== mess.membership.id)
                .map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.user.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        )}
      </div>
      {month ? (
        <MonthMeals month={month} memberId={memberId} onOpenDay={(date) => onOpenDay(date, memberId)} />
      ) : (
        <Skeleton className="h-96 rounded-xl" />
      )}
    </div>
  );
}

function MonthMeals({
  month,
  memberId,
  onOpenDay,
}: {
  month: Month;
  memberId: string;
  onOpenDay: (date: string) => void;
}) {
  const mess = useCurrentMess();
  const query = useMemberMealsQuery({ messId: mess.id, memberId, from: month.startDate, to: month.endDate });
  const { data: meals, error, refetch, isFetching } = query;

  if (error) return <ErrorState error={error} onRetry={refetch} retrying={isFetching} />;

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {meals ? (
          <>
            <StatCard
              className="col-span-2 sm:col-span-1"
              label="Weighted meals"
              icon={Soup}
              value={formatCount(meals.totals.weightedMeals)}
              helper="Used for the bill"
            />
            <StatCard label="Meals" icon={CalendarDays} value={formatCount(meals.totals.meals)} />
            <StatCard label="Guest meals" icon={UsersRound} value={formatCount(meals.totals.guestMeals)} />
          </>
        ) : (
          Array.from({ length: 3 }, (_, i) => <StatCardSkeleton key={i} />)
        )}
      </div>
      {meals ? (
        <CalendarGrid meals={meals} onOpenDay={onOpenDay} />
      ) : (
        <Skeleton className="h-80 rounded-xl" />
      )}
    </>
  );
}

function CalendarGrid({ meals, onOpenDay }: { meals: MemberMeals; onOpenDay: (date: string) => void }) {
  const mess = useCurrentMess();
  const { today, maxDate } = useMealDate();
  const { data: slots } = useMealSlotsQuery(mess.id);
  const days = datesBetween(meals.from, meals.to);
  const byDate = new Map(meals.days.map((d) => [d.date, d]));
  const visibleSlots = (slots ?? []).filter((s) => s.isActive);

  return (
    <Card className="gap-3 p-3 sm:p-4">
      <div
        className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground"
        aria-hidden
      >
        {WEEKDAYS.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <ol className="grid grid-cols-7 gap-1">
        {days.map((date, i) => {
          // No meals recorded (e.g. before joining) shows a dash rather than 0.
          const recorded = byDate.get(date);
          const day = recorded && Object.keys(recorded.meals).length > 0 ? recorded : undefined;
          const weighted = Number(day?.weightedMeals ?? 0);
          const future = date > today;
          const reachable = date <= maxDate;
          return (
            <li key={date} style={i === 0 ? { gridColumnStart: weekdayIndex(date) + 1 } : undefined}>
              <button
                type="button"
                disabled={!reachable}
                onClick={() => onOpenDay(date)}
                aria-label={`${format(parseISO(date), "EEEE d MMMM")}: ${formatCount(weighted)} meals`}
                className={cn(
                  "flex aspect-square w-full flex-col items-center justify-between rounded-lg border p-1 text-xs transition-colors duration-150 outline-none hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:pointer-events-none sm:aspect-[4/3] sm:p-2",
                  date === today && "border-primary ring-1 ring-primary",
                  future && "bg-muted/30 text-muted-foreground",
                  !reachable && "opacity-50",
                )}
              >
                <span className="self-start font-medium">{format(parseISO(date), "d")}</span>
                <span
                  className={cn(
                    "tabular text-sm font-semibold sm:text-base",
                    weighted === 0 && "text-muted-foreground/60",
                  )}
                >
                  {day ? formatCount(weighted) : "–"}
                </span>
                <span className="flex gap-0.5" aria-hidden>
                  {visibleSlots.map((s) => (
                    <span
                      key={s.id}
                      className={cn(
                        "size-1.5 rounded-full",
                        day?.meals[s.id] && isEating(day.meals[s.id]) ? "bg-primary" : "bg-border",
                      )}
                    />
                  ))}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
      <p className="text-xs text-muted-foreground">
        Each day shows weighted meals; dots are {visibleSlots.map((s) => s.name.toLowerCase()).join(", ")}.
        Tap a day to open it.
      </p>
    </Card>
  );
}
