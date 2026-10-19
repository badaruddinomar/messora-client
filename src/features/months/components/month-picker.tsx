"use client";

import { Lock } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/cn";
import { useSelectedMonth } from "../hooks/use-selected-month";
import { formatPeriod, monthKey, monthLabel } from "../utils";

/**
 * Picks the billing month for meal and money screens. The choice lives in the URL (`?month=`),
 * so every screen that uses it stays in sync and survives a refresh.
 */
export function MonthPicker({ className }: { className?: string }) {
  const { months, selected, select, isLoading } = useSelectedMonth();

  if (isLoading || !selected) return <Skeleton className={cn("h-10 w-52", className)} />;

  return (
    <Select
      value={monthKey(selected)}
      onValueChange={(key) => {
        const month = months.find((m) => monthKey(m) === key);
        if (month) select(month);
      }}
    >
      <SelectTrigger className={cn("w-full sm:w-56", className)} aria-label="Billing month">
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="max-h-80">
        {months.map((m) => (
          <SelectItem key={m.id} value={monthKey(m)}>
            <span className="flex items-center gap-2">
              <span>{monthLabel(m)}</span>
              {m.status !== "OPEN" && <Lock className="size-3 text-muted-foreground" aria-label="Closed" />}
              <span className="text-xs text-muted-foreground">
                {m.isCurrent ? "This month" : formatPeriod(m)}
              </span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
