import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/cn";

interface StatCardProps {
  label: string;
  value: ReactNode;
  icon?: LucideIcon;
  /** A trend, comparison or short explanation under the number. */
  helper?: ReactNode;
  className?: string;
}

/** Label + big number + helper text (DESIGN_SYSTEM §6). */
export function StatCard({ label, value, icon: Icon, helper, className }: StatCardProps) {
  return (
    <Card className={cn("gap-3 px-5", className)}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">{label}</p>
        {Icon && <Icon className="size-4 text-muted-foreground" aria-hidden />}
      </div>
      <div className="tabular text-2xl font-semibold tracking-tight sm:text-3xl">{value}</div>
      {helper && <div className="text-xs text-muted-foreground">{helper}</div>}
    </Card>
  );
}

export function StatCardSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn("gap-3 px-5", className)}>
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-3 w-20" />
    </Card>
  );
}
