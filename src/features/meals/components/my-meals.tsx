"use client";

import { CalendarOff, Info } from "lucide-react";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentMess, useMessPermissions } from "@/features/messes/mess-context";
import { useMessSettingsQuery } from "@/features/messes/messes-api";
import { formatCount } from "@/lib/format";
import { useMealDate } from "../hooks/use-meal-date";
import { useSaveMeals } from "../hooks/use-save-meals";
import { useMealDayQuery } from "../meals-api";
import type { DaySlot, MealDay } from "../meals-types";
import { mealOf } from "../utils";
import { MealOffList } from "./meal-off-list";
import { SlotCard } from "./slot-card";
import { UsualMealsCard } from "./usual-meals-card";

/** The member's own meals for the selected day: big toggles that save instantly. */
export function MyMeals() {
  const mess = useCurrentMess();
  const { date } = useMealDate();
  const { data: day, isLoading, error, refetch, isFetching } = useMealDayQuery({ messId: mess.id, date });

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
      <section aria-label="Meals for the day" className="grid gap-3">
        {error ? (
          <ErrorState error={error} onRetry={refetch} retrying={isFetching} />
        ) : isLoading || !day ? (
          Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-36 rounded-xl" />)
        ) : (
          <DaySlots day={day} />
        )}
      </section>
      <aside className="grid gap-4">
        {day && <UsualMealsCard defaultMealOn={day.you.defaultMealOn} />}
        <MealOffList />
      </aside>
    </div>
  );
}

function DaySlots({ day }: { day: MealDay }) {
  const { canManage } = useMessPermissions();
  const mess = useCurrentMess();
  const { data: settings } = useMessSettingsQuery(mess.id);
  const [save] = useSaveMeals();
  const row = day.rows.find((r) => r.member.id === day.you.memberId);

  if (day.slots.length === 0) {
    return (
      <EmptyState
        icon={CalendarOff}
        title="No meals set up"
        description="An admin can add meals in Settings."
      />
    );
  }
  if (!row) {
    return (
      <Alert>
        <Info />
        <AlertTitle>You weren&apos;t in the mess on this day</AlertTitle>
        <AlertDescription>Meals start from the day you joined.</AlertDescription>
      </Alert>
    );
  }

  const lockedReason = (slot: DaySlot) => {
    if (slot.canEditOwn) return undefined;
    if (!day.editable) return "This month is closed";
    if (!slot.isActive) return "This meal isn't served any more";
    if (settings && !settings.allowMemberMealEdit && !canManage)
      return "Only managers change meals in this mess";
    return undefined;
  };

  return (
    <>
      {day.slots.map((slot) => (
        <SlotCard
          key={slot.id}
          slot={slot}
          meal={mealOf(row, slot.id)}
          date={day.date}
          allowGuests={day.allowGuestMeal}
          canManage={canManage && day.editable}
          lockedReason={lockedReason(slot)}
          onChange={({ quantity, guestQuantity }) =>
            save([{ memberId: row.member.id, slotId: slot.id, date: day.date, quantity, guestQuantity }])
          }
        />
      ))}
      <p className="px-1 text-sm text-muted-foreground">
        Your meals for the day:{" "}
        <span className="tabular font-medium text-foreground">{formatCount(row.weightedMeals)}</span>
      </p>
    </>
  );
}
