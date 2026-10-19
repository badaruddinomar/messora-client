"use client";

import { cn } from "@/lib/cn";
import { formatDate, formatDay, formatRelative } from "@/lib/format";

interface DateTextProps {
  value: string | Date;
  /** `date` — 12 Oct 2026 · `day` — Today / Yesterday / 12 Oct · `relative` — 5 minutes ago */
  variant?: "date" | "day" | "relative";
  className?: string;
}

/** The only way dates are shown in the UI. The full date is always available on hover. */
export function DateText({ value, variant = "date", className }: DateTextProps) {
  const text =
    variant === "relative" ? formatRelative(value) : variant === "day" ? formatDay(value) : formatDate(value);
  const iso = value instanceof Date ? value.toISOString() : value;
  return (
    <time dateTime={iso} title={formatDate(value, "d MMM yyyy, h:mm a")} className={cn("tabular", className)}>
      {text}
    </time>
  );
}
