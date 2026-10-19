import { Badge } from "@/components/ui/badge";

/**
 * Every status in the app maps to one colour here, so they never drift between screens
 * (DESIGN_SYSTEM §3).
 */
const STATUS = {
  PENDING: { label: "Pending", variant: "warning" },
  APPROVED: { label: "Approved", variant: "success" },
  REJECTED: { label: "Rejected", variant: "destructive" },
  ACTIVE: { label: "Active", variant: "success" },
  SUSPENDED: { label: "Suspended", variant: "destructive" },
  LEFT: { label: "Left", variant: "muted" },
  OPEN: { label: "Open", variant: "info" },
  CLOSING: { label: "Closing", variant: "warning" },
  CLOSED: { label: "Closed", variant: "muted" },
  ACCEPTED: { label: "Accepted", variant: "success" },
  DECLINED: { label: "Declined", variant: "muted" },
  EXPIRED: { label: "Expired", variant: "muted" },
  REVOKED: { label: "Revoked", variant: "muted" },
  CONFIRMED: { label: "Confirmed", variant: "success" },
  DISPUTED: { label: "Disputed", variant: "destructive" },
} as const;

export type Status = keyof typeof STATUS;

export function StatusBadge({ status, className }: { status: Status; className?: string }) {
  const { label, variant } = STATUS[status];
  return (
    <Badge variant={variant} className={className}>
      <span aria-hidden className="size-1.5 rounded-full bg-current" />
      {label}
    </Badge>
  );
}
