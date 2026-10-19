"use client";

import type { ComponentProps, ReactNode } from "react";
import { RadioGroup as RadioGroupPrimitive } from "radix-ui";
import { cn } from "@/lib/cn";

export function RadioGroup({ className, ...props }: ComponentProps<typeof RadioGroupPrimitive.Root>) {
  return (
    <RadioGroupPrimitive.Root data-slot="radio-group" className={cn("grid gap-3", className)} {...props} />
  );
}

/** A selectable card: the whole card is the radio button. */
export function RadioCard({
  className,
  title,
  description,
  icon,
  ...props
}: ComponentProps<typeof RadioGroupPrimitive.Item> & {
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <RadioGroupPrimitive.Item
      data-slot="radio-card"
      className={cn(
        "group relative flex items-start gap-3 rounded-lg border bg-card p-4 text-left shadow-xs transition-[border-color,box-shadow,background-color] duration-150 outline-none",
        "hover:border-primary/40 focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50",
        "data-[state=checked]:border-primary data-[state=checked]:bg-accent/40 data-[state=checked]:ring-1 data-[state=checked]:ring-primary",
        className,
      )}
      {...props}
    >
      {icon && (
        <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground transition-colors group-data-[state=checked]:bg-primary group-data-[state=checked]:text-primary-foreground">
          {icon}
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium">{title}</span>
        {description && <span className="mt-0.5 block text-xs text-muted-foreground">{description}</span>}
      </span>
      <span
        aria-hidden
        className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border border-input group-data-[state=checked]:border-primary"
      >
        <RadioGroupPrimitive.Indicator className="size-2 rounded-full bg-primary" />
      </span>
    </RadioGroupPrimitive.Item>
  );
}
