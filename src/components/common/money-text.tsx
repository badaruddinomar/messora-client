import { cn } from "@/lib/cn";
import { formatMoney, isNegative, isZero } from "@/lib/format";
import type { Money } from "@/types/api";

interface MoneyTextProps {
  value: Money | number;
  /**
   * `plain` — just the amount (expenses, deposits, totals).
   * `balance` — a member balance: negative reads "Due ৳500" in red, positive "Refund ৳500" in green
   *   (BUSINESS_RULES §8 sign convention; DESIGN_SYSTEM §3 money colours).
   */
  variant?: "plain" | "balance";
  compact?: boolean;
  className?: string;
}

/** The only way amounts are shown in the UI. */
export function MoneyText({ value, variant = "plain", compact, className }: MoneyTextProps) {
  const amount = formatMoney(value, { compact });

  if (variant === "plain") {
    return (
      <span className={cn("tabular", isNegative(value) && "text-destructive", className)}>
        {isNegative(value) ? `−${amount}` : amount}
      </span>
    );
  }

  if (isZero(value)) {
    return <span className={cn("tabular text-muted-foreground", className)}>Settled</span>;
  }
  const owes = isNegative(value);
  return (
    <span className={cn("tabular", owes ? "text-destructive" : "text-success", className)}>
      {owes ? "Due" : "Refund"} {amount}
    </span>
  );
}
