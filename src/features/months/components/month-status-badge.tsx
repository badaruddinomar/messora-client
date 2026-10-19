import { Badge } from "@/components/ui/badge";
import type { Month } from "../months-types";

/**
 * A month's state in words. An ended month that's still OPEN reads "Waiting to close", so managers
 * know it needs closing, not just "Open".
 */
export function MonthStatusBadge({
  month,
  className,
}: {
  month: Pick<Month, "status" | "hasEnded">;
  className?: string;
}) {
  const { label, variant } =
    month.status === "CLOSED"
      ? { label: "Closed", variant: "muted" as const }
      : month.status === "CLOSING"
        ? { label: "Closing", variant: "warning" as const }
        : month.hasEnded
          ? { label: "Waiting to close", variant: "warning" as const }
          : { label: "Open", variant: "info" as const };

  return (
    <Badge variant={variant} className={className}>
      <span aria-hidden className="size-1.5 rounded-full bg-current" />
      {label}
    </Badge>
  );
}
