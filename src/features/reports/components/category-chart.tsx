"use client";

import { Bar, BarChart, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartCard } from "@/components/charts/chart-card";
import { AXIS, ChartTooltip } from "@/components/charts/chart-tooltip";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CATEGORY_LABELS } from "@/features/expenses/expenses-types";
import { formatMoney } from "@/lib/format";
import { categoryInsight } from "../insights";
import type { MonthReport } from "../reports-types";

/** Where the month's shared costs went, biggest first (bars, value at the tip). */
export function CategoryChart({ report, isFetching }: { report?: MonthReport; isFetching?: boolean }) {
  const rows = (report?.expensesByCategory ?? []).map((r) => ({
    ...r,
    label: CATEGORY_LABELS[r.category],
    value: Number(r.total),
  }));

  return (
    <ChartCard
      title={categoryInsight(report?.expensesByCategory ?? [])}
      description="Approved shared costs this month."
      isLoading={!report}
      isFetching={isFetching}
      empty={
        report && rows.length === 0
          ? { title: "No shared costs", description: "Bills like rent, gas and salaries show up here." }
          : null
      }
      chart={
        <ResponsiveContainer width="100%" height={rows.length * 36 + 8}>
          <BarChart data={rows} layout="vertical" margin={{ top: 0, right: 72, bottom: 0, left: 0 }}>
            <XAxis type="number" hide domain={[0, "dataMax"]} />
            <YAxis type="category" dataKey="label" {...AXIS} width={104} />
            <Tooltip
              cursor={{ fill: "var(--muted)", opacity: 0.6 }}
              content={({ active, payload }) => {
                const r = payload?.[0]?.payload as (typeof rows)[number] | undefined;
                return (
                  <ChartTooltip
                    active={active}
                    value={r ? formatMoney(r.total) : null}
                    label={r ? `${r.label} · ${r.count} ${r.count === 1 ? "bill" : "bills"}` : ""}
                  />
                );
              }}
            />
            <Bar
              dataKey="value"
              fill="var(--chart-series)"
              radius={[0, 4, 4, 0]}
              barSize={20}
              animationDuration={400}
            >
              <LabelList
                dataKey="value"
                position="right"
                className="fill-foreground text-xs tabular-nums"
                formatter={(v) => formatMoney(Number(v), { compact: true })}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      }
      table={
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Bills</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.category}>
                <TableCell>{r.label}</TableCell>
                <TableCell className="tabular text-right">{r.count}</TableCell>
                <TableCell className="tabular text-right">{formatMoney(r.total)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      }
    />
  );
}
