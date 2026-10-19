"use client";

import type { ComponentProps } from "react";
import { DayPicker, getDefaultClassNames } from "react-day-picker";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { buttonVariants } from "./button";

export function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: ComponentProps<typeof DayPicker>) {
  const defaults = getDefaultClassNames();
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-1 [--cell-size:--spacing(9)]", className)}
      classNames={{
        root: cn("w-fit", defaults.root),
        months: cn("relative flex flex-col gap-4 md:flex-row", defaults.months),
        month: cn("flex w-full flex-col gap-3", defaults.month),
        nav: cn("absolute inset-x-0 top-0 flex w-full items-center justify-between gap-1", defaults.nav),
        button_previous: cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), defaults.button_previous),
        button_next: cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), defaults.button_next),
        month_caption: cn("flex h-8 items-center justify-center text-sm font-medium", defaults.month_caption),
        weekdays: cn("flex", defaults.weekdays),
        weekday: cn("flex-1 text-[0.8rem] font-normal text-muted-foreground select-none", defaults.weekday),
        week: cn("mt-1 flex w-full", defaults.week),
        day: cn(
          "relative aspect-square size-(--cell-size) p-0 text-center text-sm select-none",
          defaults.day,
        ),
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "tabular size-(--cell-size) rounded-md p-0 font-normal aria-selected:opacity-100",
          defaults.day_button,
        ),
        selected: cn(
          "[&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:hover:bg-primary [&>button]:hover:text-primary-foreground",
          defaults.selected,
        ),
        range_middle: cn(
          "[&>button]:rounded-none [&>button]:!bg-accent [&>button]:!text-accent-foreground",
          defaults.range_middle,
        ),
        range_start: cn("[&>button]:rounded-r-none", defaults.range_start),
        range_end: cn("[&>button]:rounded-l-none", defaults.range_end),
        today: cn("[&>button]:font-semibold [&>button]:text-primary", defaults.today),
        outside: cn("text-muted-foreground opacity-50", defaults.outside),
        disabled: cn("text-muted-foreground opacity-40", defaults.disabled),
        hidden: cn("invisible", defaults.hidden),
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, className: chevronClass }) =>
          orientation === "left" ? (
            <ChevronLeft className={cn("size-4", chevronClass)} />
          ) : (
            <ChevronRight className={cn("size-4", chevronClass)} />
          ),
      }}
      {...props}
    />
  );
}
