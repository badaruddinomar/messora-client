"use client";

import { format } from "date-fns";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartCard } from "@/components/charts/chart-card";
import { AXIS, ChartTooltip, moneyTick } from "@/components/charts/chart-tooltip";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCurrentMess } from "@/features/messes/mess-context";
import { formatCount, formatMoney } from "@/lib/format";
import { hasRate, mealRateInsight } from "../insights";
import { useTrendsQuery } from "../reports-api";
import type { TrendPoint } from "../reports-types";

type Point = TrendPoint & { label: string; rate: number | null };

interface DotProps {
  cx?: number;
  cy?: number;
  index?: number;
  payload?: Point;
}

/** Meal rate over the last months: closed months as billed, the open one as an estimate (hollow dot). */
export function MealRateChart({ months = 6, className }: { months?: number; className?: string }) {
  const mess = useCurrentMess();
  const { data, isLoading, isFetching } = useTrendsQuery({ messId: mess.id, months });
  const points: Point[] = (data ?? []).map((p) => ({
    ...p,
    label: format(new Date(p.year, p.month - 1, 1), "MMM"),
    rate: hasRate(p) ? Number(p.mealRate) : null,
  }));
  const lastRated = points.findLastIndex((p) => p.rate !== null);

  // Every point gets a dot with a surface ring; the latest one also carries its value (DESIGN_SYSTEM §9).
  const renderDot = ({ cx, cy, index, payload }: DotProps) => {
    if (cx === undefined || cy === undefined || !payload || payload.rate === null)
      return <g key={`dot-${index}`} />;
    return (
      <g key={`dot-${index}`}>
        <circle
          cx={cx}
          cy={cy}
          r={4}
          fill={payload.isFinal ? "var(--chart-series)" : "var(--card)"}
          stroke={payload.isFinal ? "var(--card)" : "var(--chart-series)"}
          strokeWidth={2}
        />
        {index === lastRated && (
          <text
            x={cx}
            y={cy - 12}
            textAnchor="middle"
            className="fill-foreground text-xs font-medium tabular-nums"
          >
            {formatMoney(payload.mealRate)}
          </text>
        )}
      </g>
    );
  };

  return (
    <ChartCard
      className={className}
      title={mealRateInsight(data ?? [])}
      description="Taka per meal. A hollow dot is the month so far."
      isLoading={isLoading}
      isFetching={isFetching}
      empty={
        !isLoading && lastRated === -1
          ? { title: "No meal rate yet", description: "It shows up once meals and bazar are recorded." }
          : null
      }
      chart={
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={points} margin={{ top: 24, right: 16, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis dataKey="label" {...AXIS} />
            <YAxis {...AXIS} width={52} tickFormatter={moneyTick} domain={[0, "auto"]} />
            <Tooltip
              cursor={{ stroke: "var(--border)" }}
              content={({ active, payload }) => {
                const p = payload?.[0]?.payload as Point | undefined;
                return (
                  <ChartTooltip
                    active={active}
                    value={p?.rate != null ? `${formatMoney(p.mealRate)} / meal` : null}
                    label={p ? format(new Date(p.year, p.month - 1, 1), "MMMM yyyy") : ""}
                    note={p && !p.isFinal ? "So far (estimate)" : undefined}
                  />
                );
              }}
            />
            <Line
              dataKey="rate"
              stroke="var(--chart-series)"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              dot={renderDot}
              activeDot={{ r: 5, fill: "var(--chart-series)", stroke: "var(--card)", strokeWidth: 2 }}
              animationDuration={400}
            />
          </LineChart>
        </ResponsiveContainer>
      }
      table={
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Month</TableHead>
              <TableHead className="text-right">Meal rate</TableHead>
              <TableHead className="text-right">Meals</TableHead>
              <TableHead className="text-right">Bazar</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {points.map((p) => (
              <TableRow key={p.monthId}>
                <TableCell>
                  {format(new Date(p.year, p.month - 1, 1), "MMMM yyyy")}
                  {!p.isFinal && <span className="text-muted-foreground"> · so far</span>}
                </TableCell>
                <TableCell className="tabular text-right">
                  {p.rate === null ? "–" : formatMoney(p.mealRate)}
                </TableCell>
                <TableCell className="tabular text-right">{formatCount(p.totalMeals)}</TableCell>
                <TableCell className="tabular text-right">{formatMoney(p.totalBazar)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      }
    />
  );
}
