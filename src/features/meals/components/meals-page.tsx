"use client";

import { parseAsStringLiteral, useQueryState } from "nuqs";
import { CalendarOff } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCurrentMess, useMessPermissions } from "@/features/messes/mess-context";
import { useMealDate } from "../hooks/use-meal-date";
import { DayNavigator } from "./day-navigator";
import { MealCalendar } from "./meal-calendar";
import { MealOffDialog } from "./meal-off-dialog";
import { MealOffList } from "./meal-off-list";
import { MealRequests } from "./meal-requests";
import { MealSheet } from "./meal-sheet";
import { MyMeals } from "./my-meals";

const TABS = ["my", "sheet", "calendar", "requests"] as const;
type Tab = (typeof TABS)[number];

/** Meals: today's toggles, the whole mess's sheet, a monthly calendar and requests. */
export function MealsPage() {
  const mess = useCurrentMess();
  const { canManage } = useMessPermissions();
  const { setDate } = useMealDate();
  const [tab, setTab] = useQueryState("tab", parseAsStringLiteral(TABS).withDefault("my"));

  const openDay = (date: string, memberId: string) => {
    setDate(date);
    setTab(memberId === mess.membership.id ? null : "sheet");
  };

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Meals"
        description={
          canManage
            ? "Switch meals on or off, fix counts for anyone, and post the menu."
            : "Switch your meals on or off before each cutoff."
        }
        actions={
          <MealOffDialog
            trigger={(open) => (
              <Button variant="outline" onClick={open}>
                <CalendarOff />
                Meal off
              </Button>
            )}
          />
        }
      />

      <Tabs value={tab} onValueChange={(v) => setTab(v === "my" ? null : (v as Tab))}>
        <TabsList className="w-full sm:w-fit">
          <TabsTrigger value="my">My meals</TabsTrigger>
          <TabsTrigger value="sheet">{canManage ? "Meal sheet" : "Everyone"}</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="requests">Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="my" className="grid gap-4">
          <DayNavigator />
          <MyMeals />
        </TabsContent>
        <TabsContent value="sheet" className="grid gap-4">
          <DayNavigator />
          <MealSheet />
          {canManage && <MealOffList everyone />}
        </TabsContent>
        <TabsContent value="calendar">
          <MealCalendar onOpenDay={openDay} />
        </TabsContent>
        <TabsContent value="requests">
          <MealRequests />
        </TabsContent>
      </Tabs>
    </div>
  );
}
