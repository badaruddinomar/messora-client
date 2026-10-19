"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/format";

interface DatePickerProps {
  /** Calendar day as `YYYY-MM-DD` (the API's date format). */
  value?: string;
  onChange: (value: string | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  /** Days that can't be picked, e.g. outside the open month. */
  isDisabledDay?: (day: Date) => boolean;
  className?: string;
  id?: string;
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  disabled,
  isDisabledDay,
  className,
  id,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const selected = value ? parseISO(value) : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          disabled={disabled}
          className={cn("w-full justify-start font-normal", !value && "text-muted-foreground", className)}
        >
          <CalendarDays />
          {value ? formatDate(value) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2" align="start">
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={selected}
          disabled={isDisabledDay}
          onSelect={(day) => {
            onChange(day ? format(day, "yyyy-MM-dd") : undefined);
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
