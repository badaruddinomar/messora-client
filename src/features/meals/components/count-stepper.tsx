"use client";

import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { formatCount } from "@/lib/format";

interface CountStepperProps {
  value: number;
  onChange: (value: number) => void;
  /** Accessible name, e.g. "Guests for lunch". */
  label: string;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  className?: string;
}

/** − 2 + control for meal and guest counts. */
export function CountStepper({
  value,
  onChange,
  label,
  min = 0,
  max = 10,
  step = 1,
  disabled = false,
  className,
}: CountStepperProps) {
  return (
    <div role="group" aria-label={label} className={cn("inline-flex items-center gap-1", className)}>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="size-8 rounded-full"
        aria-label={`Fewer ${label.toLowerCase()}`}
        disabled={disabled || value <= min}
        onClick={() => onChange(Math.max(min, value - step))}
      >
        <Minus />
      </Button>
      <output aria-live="polite" className="tabular w-8 text-center text-sm font-medium">
        {formatCount(value)}
      </output>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="size-8 rounded-full"
        aria-label={`More ${label.toLowerCase()}`}
        disabled={disabled || value >= max}
        onClick={() => onChange(Math.min(max, value + step))}
      >
        <Plus />
      </Button>
    </div>
  );
}
