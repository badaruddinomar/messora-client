"use client";

import type { ComponentProps } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/cn";

type MoneyInputProps = Omit<ComponentProps<"input">, "value" | "onChange" | "type"> & {
  value: string;
  onChange: (value: string) => void;
};

/**
 * Amount field with the ৳ sign (DESIGN_SYSTEM §6). Keeps the value as a string and only lets through
 * digits and up to two decimals, so it never goes through floating point.
 */
export function MoneyInput({ value, onChange, className, ...props }: MoneyInputProps) {
  return (
    <div className="relative">
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground"
      >
        ৳
      </span>
      <Input
        {...props}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        value={value}
        onChange={(e) => {
          const next = e.target.value.replace(/,/g, "").trim();
          if (next === "" || /^\d{0,10}(\.\d{0,2})?$/.test(next)) onChange(next);
        }}
        className={cn("tabular pl-7", className)}
      />
    </div>
  );
}
