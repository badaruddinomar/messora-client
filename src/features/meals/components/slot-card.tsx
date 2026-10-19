"use client";

import { Check, Clock, Lock, UtensilsCrossed } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useNow } from "@/hooks/use-now";
import { cn } from "@/lib/cn";
import { formatCount } from "@/lib/format";
import type { DaySlot, MealValue } from "../meals-types";
import { formatTimeLeft, formatTimeOfDay, formatWeight } from "../utils";
import { CountStepper } from "./count-stepper";
import { MenuDialog } from "./menu-dialog";

interface SlotCardProps {
  slot: DaySlot;
  meal: MealValue;
  date: string;
  allowGuests: boolean;
  /** Managers can post the menu. */
  canManage: boolean;
  /** Why the caller can't change this meal, if they can't. */
  lockedReason?: string;
  onChange: (next: { quantity: number; guestQuantity: number }) => void;
}

/** One meal of the day as a big on/off toggle, with guests, the menu and the cutoff. */
export function SlotCard({
  slot,
  meal,
  date,
  allowGuests,
  canManage,
  lockedReason,
  onChange,
}: SlotCardProps) {
  const quantity = Number(meal.quantity);
  const guests = Number(meal.guestQuantity);
  const on = quantity > 0;
  const disabled = !slot.canEditOwn;

  return (
    <Card
      data-state={on ? "on" : "off"}
      className={cn(
        "gap-0 overflow-hidden py-0 transition-colors duration-150",
        on ? "border-primary/40 bg-primary/[0.04]" : "bg-card",
      )}
    >
      <button
        type="button"
        aria-pressed={on}
        aria-label={`${slot.name}: ${on ? "on" : "off"}`}
        disabled={disabled}
        onClick={() => onChange({ quantity: on ? 0 : 1, guestQuantity: on ? 0 : guests })}
        className="group flex w-full items-center gap-4 p-4 text-left transition-transform duration-150 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:ring-inset active:scale-[0.99] disabled:cursor-not-allowed disabled:active:scale-100"
      >
        <span
          aria-hidden
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-150",
            on ? "border-primary bg-primary text-primary-foreground" : "border-border text-transparent",
          )}
        >
          <Check className="size-5" strokeWidth={3} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="text-base font-semibold">{slot.name}</span>
            <Badge variant="muted" className="tabular">
              {formatWeight(slot.weight)}
            </Badge>
          </span>
          <span className="mt-0.5 block text-sm text-muted-foreground">
            {on ? (quantity === 1 ? "You're eating" : `${formatCount(quantity)} meals`) : "Off"}
            {guests > 0 && ` · ${formatCount(guests)} ${guests === 1 ? "guest" : "guests"}`}
          </span>
        </span>
      </button>

      <div className="grid gap-3 border-t bg-muted/20 px-4 py-3">
        <MenuLine slot={slot} date={date} canManage={canManage} />
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <CutoffLine slot={slot} lockedReason={lockedReason} />
          {allowGuests && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Guests</span>
              <CountStepper
                label={`Guests for ${slot.name}`}
                value={guests}
                disabled={disabled}
                onChange={(guestQuantity) => onChange({ quantity, guestQuantity })}
              />
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

function MenuLine({ slot, date, canManage }: { slot: DaySlot; date: string; canManage: boolean }) {
  return (
    <div className="flex items-start gap-2 text-sm">
      <UtensilsCrossed className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
      <p className={cn("min-w-0 flex-1", !slot.menu && "text-muted-foreground")}>
        {slot.menu ? (
          <>
            {slot.menu.items}
            {slot.menu.note && <span className="text-muted-foreground"> · {slot.menu.note}</span>}
          </>
        ) : (
          "No menu yet"
        )}
      </p>
      {canManage && <MenuDialog slot={slot} date={date} />}
    </div>
  );
}

function CutoffLine({ slot, lockedReason }: { slot: DaySlot; lockedReason?: string }) {
  const now = useNow();
  const left = new Date(slot.cutoffAt).getTime() - now.getTime();
  const at = slot.cutoffTime ? formatTimeOfDay(slot.cutoffTime) : "the start of the day";

  if (lockedReason) {
    return (
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Lock className="size-3.5" aria-hidden />
        {lockedReason}
      </p>
    );
  }
  if (left > 0) {
    return (
      <p
        className={cn(
          "flex items-center gap-1.5 text-xs",
          left < 3_600_000 ? "text-warning-foreground dark:text-warning" : "text-muted-foreground",
        )}
      >
        <Clock className="size-3.5" aria-hidden />
        Changes close in <span className="tabular font-medium">{formatTimeLeft(left)}</span>
      </p>
    );
  }
  return (
    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <Lock className="size-3.5" aria-hidden />
      {slot.canEditOwn ? `Past the ${at} cutoff — you can still change it as a manager` : `Locked at ${at}`}
    </p>
  );
}
