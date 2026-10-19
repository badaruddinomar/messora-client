import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

/** Placeholder shaped like the content it replaces (DESIGN_SYSTEM §7). */
export function Skeleton({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
}
