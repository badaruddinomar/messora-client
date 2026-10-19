"use client";

import { useContext, type ComponentProps } from "react";
import { OTPInput, OTPInputContext, REGEXP_ONLY_DIGITS } from "input-otp";
import { cn } from "@/lib/cn";

/**
 * Segmented one-time-code input. Supports paste, SMS/email autofill (`autocomplete="one-time-code"`)
 * and keyboard navigation.
 */
export function InputOTP({
  className,
  containerClassName,
  maxLength = 6,
  ...props
}: Omit<ComponentProps<typeof OTPInput>, "maxLength" | "render" | "children"> & { maxLength?: number }) {
  return (
    <OTPInput
      data-slot="input-otp"
      maxLength={maxLength}
      pattern={REGEXP_ONLY_DIGITS}
      inputMode="numeric"
      autoComplete="one-time-code"
      containerClassName={cn("flex items-center has-disabled:opacity-50", containerClassName)}
      className={cn("disabled:cursor-not-allowed", className)}
      {...props}
    >
      <div className="flex w-full items-center justify-between gap-2">
        {Array.from({ length: maxLength }, (_, index) => (
          <InputOTPSlot key={index} index={index} />
        ))}
      </div>
    </OTPInput>
  );
}

function InputOTPSlot({ index }: { index: number }) {
  const context = useContext(OTPInputContext);
  const { char, hasFakeCaret, isActive } = context?.slots[index] ?? {};
  return (
    <div
      data-slot="input-otp-slot"
      data-active={isActive}
      className={cn(
        "tabular relative flex h-12 w-full max-w-12 items-center justify-center rounded-md border border-input bg-card text-lg font-medium shadow-xs transition-[border-color,box-shadow] duration-150",
        "data-[active=true]:z-10 data-[active=true]:border-ring data-[active=true]:ring-[3px] data-[active=true]:ring-ring/25",
        "group-aria-invalid:border-destructive",
      )}
    >
      {char}
      {hasFakeCaret && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-5 w-px animate-pulse bg-foreground" />
        </div>
      )}
    </div>
  );
}
