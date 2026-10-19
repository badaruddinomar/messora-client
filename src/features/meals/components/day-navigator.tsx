"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { addDays } from "@/lib/date";
import { cn } from "@/lib/cn";
import { useMealDate } from "../hooks/use-meal-date";

/** "Today", "Tomorrow", "Yesterday" relative to the mess's today; otherwise the weekday. */
export function relativeDayLabel(date: string, today: string) {
  if (date === today) return "Today";
  if (date === addDays(today, 1)) return "Tomorrow";
  if (date === addDays(today, -1)) return "Yesterday";
  return format(parseISO(date), "EEEE");
}

/** ‹ Today · Mon, 19 Oct › with a calendar to jump to a day (up to the planning window). */
export function DayNavigator({ className }: { className?: string }) {
  const { date, today, maxDate, setDate } = useMealDate();
  const [open, setOpen] = useState(false);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Button
        variant="outline"
        size="icon"
        aria-label="Previous day"
        onClick={() => setDate(addDays(date, -1))}
      >
        <ChevronLeft />
      </Button>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="min-w-0 flex-1 justify-center gap-2 sm:flex-none sm:px-4">
            <CalendarDays className="text-muted-foreground" />
            <span className="font-semibold">{relativeDayLabel(date, today)}</span>
            <span className="truncate text-muted-foreground">{format(parseISO(date), "d MMM yyyy")}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2" align="center">
          <Calendar
            mode="single"
            selected={parseISO(date)}
            defaultMonth={parseISO(date)}
            disabled={(day) => format(day, "yyyy-MM-dd") > maxDate}
            onSelect={(day) => {
              if (day) setDate(format(day, "yyyy-MM-dd"));
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
      <Button
        variant="outline"
        size="icon"
        aria-label="Next day"
        disabled={date >= maxDate}
        onClick={() => setDate(addDays(date, 1))}
      >
        <ChevronRight />
      </Button>
      {date !== today && (
        <Button variant="ghost" size="sm" onClick={() => setDate(today)}>
          Today
        </Button>
      )}
    </div>
  );
}
