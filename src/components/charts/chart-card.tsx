"use client";

import { useState, type ReactNode } from "react";
import { BarChart3, Table2 } from "lucide-react";
import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/cn";

interface ChartCardProps {
  /** The insight, not the metric ("Meal rate is down 8% from September"), DESIGN_SYSTEM §9. */
  title: string;
  description?: string;
  /** The chart itself; `table` is the same data as a table (for screen readers, print and exact values). */
  chart: ReactNode;
  table: ReactNode;
  isLoading?: boolean;
  /** Refetching keeps the last render, dimmed, instead of flashing a skeleton. */
  isFetching?: boolean;
  empty?: { title: string; description: string } | null;
  className?: string;
}

/** A card holding one chart, with a chart/table switch and an empty state. */
export function ChartCard({
  title,
  description,
  chart,
  table,
  isLoading,
  isFetching,
  empty,
  className,
}: ChartCardProps) {
  const [view, setView] = useState<"chart" | "table">("chart");
  const showTable = view === "table";

  return (
    // min-w-0: a chart sizes itself to its box, so the box must be free to shrink inside grids.
    <Card className={cn("min-w-0 break-inside-avoid", className)}>
      {/* In print the Table switch is hidden, so the header is a single column. */}
      <CardHeader className="print:has-data-[slot=card-action]:grid-cols-1">
        <CardTitle className="text-base">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
        {!empty && !isLoading && (
          <CardAction className="print:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setView(showTable ? "chart" : "table")}
              aria-pressed={showTable}
            >
              {showTable ? <BarChart3 /> : <Table2 />}
              {showTable ? "Chart" : "Table"}
            </Button>
          </CardAction>
        )}
      </CardHeader>
      <CardContent className={cn("transition-opacity", isFetching && !isLoading && "opacity-60")}>
        {isLoading ? (
          <Skeleton className="h-56" />
        ) : empty ? (
          <EmptyState icon={BarChart3} title={empty.title} description={empty.description} className="py-8" />
        ) : (
          <>
            {/* Charts don't print well in every browser, so print shows the table. */}
            <div className={cn("min-w-0", showTable ? "hidden" : "print:hidden")}>{chart}</div>
            <div className={cn(!showTable && "hidden print:block")}>{table}</div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
