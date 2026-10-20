"use client";

/** Tooltip body for Recharts: the value leads, the label follows, keyed by a short line of the series color. */
export function ChartTooltip({
  active,
  label,
  value,
  note,
}: {
  active?: boolean;
  label: string;
  value: string | null;
  note?: string;
}) {
  if (!active || value === null) return null;
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-sm shadow-md">
      <div className="flex items-center gap-2">
        <span className="h-0.5 w-3 rounded-full bg-chart-series" aria-hidden />
        <span className="tabular font-semibold text-popover-foreground">{value}</span>
      </div>
      <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
      {note && <p className="text-xs text-muted-foreground">{note}</p>}
    </div>
  );
}

/** Axis ticks: clean, compact money (৳0, ৳500, ৳1.5K). */
export const moneyTick = (value: number) =>
  value >= 1000 ? `৳${Number((value / 1000).toFixed(1))}K` : `৳${Number(value.toFixed(2))}`;

/** Shared Recharts axis styling: recessive hairlines and muted text. */
export const AXIS = {
  tickLine: false,
  axisLine: false,
  tick: { fill: "var(--muted-foreground)", fontSize: 12 },
} as const;
