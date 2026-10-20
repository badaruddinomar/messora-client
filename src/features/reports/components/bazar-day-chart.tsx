"use client";

import { format } from "date-fns";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartCard } from "@/components/charts/chart-card";
import { AXIS, ChartTooltip, moneyTick } from "@/components/charts/chart-tooltip";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatMoney } from "@/lib/format";
import { bazarDayInsight } from "../insights";
import type { MonthReport } from "../reports-types";

const day = (date: string) => new Date(`${date}T00:00:00`);

/** Approved bazar for each day of the month so far (columns from one baseline). */
export function BazarDayChart({ report, isFetching }: { report?: MonthReport; isFetching?: boolean }) {
  const days = (report?.bazarByDay ?? []).map((d) => ({
    ...d,
    label: format(day(d.date), "d"),
    value: Number(d.total),
  }));
  const shopped = days.filter((d) => d.count > 0);

  return (
    <ChartCard
      title={bazarDayInsight(report?.bazarByDay ?? [])}
      description="Approved bazar per day."
      isLoading={!report}
      isFetching={isFetching}
      empty={
        report && shopped.length === 0
          ? { title: "No bazar yet", description: "Approved bazar shows up here day by day." }
          : null
      }
      chart={
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={days} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} barCategoryGap="20%">
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis
              dataKey="label"
              {...AXIS}
              interval={days.length > 10 ? Math.ceil(days.length / 7) - 1 : 0}
            />
            <YAxis {...AXIS} width={52} tickFormatter={moneyTick} />
            <Tooltip
              cursor={{ fill: "var(--muted)", opacity: 0.6 }}
              content={({ active, payload }) => {
                const d = payload?.[0]?.payload as (typeof days)[number] | undefined;
                return (
                  <ChartTooltip
                    active={active}
                    value={d ? formatMoney(d.total) : null}
                    label={d ? format(day(d.date), "EEE, d MMM") : ""}
                    note={d && d.count > 1 ? `${d.count} bazars` : undefined}
                  />
                );
              }}
            />
            <Bar
              dataKey="value"
              fill="var(--chart-series)"
              radius={[4, 4, 0, 0]}
              maxBarSize={24}
              animationDuration={400}
            />
          </BarChart>
        </ResponsiveContainer>
      }
      table={
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Day</TableHead>
              <TableHead className="text-right">Bazars</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shopped.map((d) => (
              <TableRow key={d.date}>
                <TableCell>{format(day(d.date), "EEE, d MMM")}</TableCell>
                <TableCell className="tabular text-right">{d.count}</TableCell>
                <TableCell className="tabular text-right">{formatMoney(d.total)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      }
    />
  );
}
