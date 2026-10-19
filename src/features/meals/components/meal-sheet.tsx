"use client";

import type { KeyboardEvent } from "react";
import { ChevronDown, Users } from "lucide-react";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { UserAvatar } from "@/components/common/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCurrentMess } from "@/features/messes/mess-context";
import { cn } from "@/lib/cn";
import { formatCount } from "@/lib/format";
import { useMealDate } from "../hooks/use-meal-date";
import { useSaveMeals } from "../hooks/use-save-meals";
import { useMealDayQuery } from "../meals-api";
import type { DayRow, DaySlot, MealDay } from "../meals-types";
import { formatWeight, mealOf } from "../utils";

/**
 * Everyone's meals for one day (managers): what the cook needs, and the place to fix counts.
 * Type a number and press Enter or Tab; Enter moves down the column, like a spreadsheet.
 */
export function MealSheet() {
  const mess = useCurrentMess();
  const { date } = useMealDate();
  const { data: day, isLoading, error, refetch, isFetching } = useMealDayQuery({ messId: mess.id, date });

  if (error) return <ErrorState error={error} onRetry={refetch} retrying={isFetching} />;
  if (isLoading || !day) return <Skeleton className="h-80 rounded-xl" />;
  if (day.rows.length === 0) {
    return <EmptyState icon={Users} title="Nobody was in the mess on this day" />;
  }
  return <SheetTable day={day} />;
}

function SheetTable({ day }: { day: MealDay }) {
  const [save] = useSaveMeals();
  const editable = day.canEditOthers;

  const setAll = (slot: DaySlot, quantity: number) =>
    save(
      day.rows.map((row) => ({
        memberId: row.member.id,
        slotId: slot.id,
        date: day.date,
        quantity,
        guestQuantity: Number(mealOf(row, slot.id).guestQuantity),
      })),
    );

  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {day.slots.map((slot) => (
          <Card key={slot.id} className="gap-1 px-4 py-3">
            <p className="text-xs text-muted-foreground">{slot.name}</p>
            <p className="tabular text-xl font-semibold">
              {formatCount(day.totals[slot.id]?.meals ?? 0)}
              {Number(day.totals[slot.id]?.guests ?? 0) > 0 && (
                <span className="ml-1 text-sm font-normal text-muted-foreground">
                  + {formatCount(day.totals[slot.id].guests)} guests
                </span>
              )}
            </p>
          </Card>
        ))}
        <Card className="gap-1 border-primary/30 bg-primary/[0.04] px-4 py-3">
          <p className="text-xs text-muted-foreground">Weighted meals</p>
          <p className="tabular text-xl font-semibold">{formatCount(day.weightedTotal)}</p>
        </Card>
      </div>

      <Card className="gap-0 overflow-hidden py-0">
        <Table className="min-w-[36rem]">
          <TableHeader className="bg-muted/40">
            <TableRow className="hover:bg-transparent">
              <TableHead className="sticky left-0 z-10 bg-muted/95 backdrop-blur">Member</TableHead>
              {day.slots.map((slot) => (
                <TableHead key={slot.id} className="text-center">
                  {editable ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="-mx-2 h-7 gap-1 px-2">
                          {slot.name}
                          <span className="text-xs font-normal text-muted-foreground">
                            {formatWeight(slot.weight)}
                          </span>
                          <ChevronDown className="size-3.5 text-muted-foreground" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="center">
                        <DropdownMenuItem onSelect={() => setAll(slot, 1)}>Everyone on</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => setAll(slot, 0)}>Everyone off</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <>
                      {slot.name} <span className="text-xs font-normal">{formatWeight(slot.weight)}</span>
                    </>
                  )}
                </TableHead>
              ))}
              <TableHead className="text-right">Weighted</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {day.rows.map((row, r) => (
              <TableRow key={row.member.id}>
                <TableCell className="sticky left-0 z-10 bg-card">
                  <div className="flex items-center gap-2">
                    <UserAvatar name={row.member.name} src={row.member.avatarUrl} size="sm" />
                    <span className="max-w-[10rem] truncate font-medium">{row.member.name}</span>
                    {row.member.isYou && <Badge variant="muted">You</Badge>}
                  </div>
                </TableCell>
                {day.slots.map((slot, c) => (
                  <TableCell key={slot.id} className="text-center">
                    <SheetCell
                      row={row}
                      slot={slot}
                      date={day.date}
                      position={{ row: r, col: c }}
                      editable={editable}
                      allowGuests={day.allowGuestMeal}
                      onSave={(quantity, guestQuantity) =>
                        save([
                          {
                            memberId: row.member.id,
                            slotId: slot.id,
                            date: day.date,
                            quantity,
                            guestQuantity,
                          },
                        ])
                      }
                    />
                  </TableCell>
                ))}
                <TableCell className="tabular text-right font-medium">
                  {formatCount(row.weightedMeals)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow className="hover:bg-transparent">
              <TableCell className="sticky left-0 z-10 bg-muted/95 backdrop-blur">Total</TableCell>
              {day.slots.map((slot) => (
                <TableCell key={slot.id} className="tabular text-center">
                  {formatCount(day.totals[slot.id]?.meals ?? 0)}
                  {Number(day.totals[slot.id]?.guests ?? 0) > 0 && (
                    <span className="text-muted-foreground"> +{formatCount(day.totals[slot.id].guests)}</span>
                  )}
                </TableCell>
              ))}
              <TableCell className="tabular text-right">{formatCount(day.weightedTotal)}</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </Card>
      {!editable && (
        <p className="text-sm text-muted-foreground">
          {day.editable
            ? "Only managers can change other people's meals."
            : "This month is closed, so meals can't change."}
        </p>
      )}
    </div>
  );
}

interface SheetCellProps {
  row: DayRow;
  slot: DaySlot;
  date: string;
  position: { row: number; col: number };
  editable: boolean;
  allowGuests: boolean;
  onSave: (quantity: number, guestQuantity: number) => void;
}

const isValidCount = (value: number, max: number) =>
  Number.isFinite(value) && value >= 0 && value <= max && value * 2 === Math.round(value * 2);

function SheetCell({ row, slot, position, editable, allowGuests, onSave }: SheetCellProps) {
  const meal = mealOf(row, slot.id);
  const quantity = Number(meal.quantity);
  const guests = Number(meal.guestQuantity);

  if (!editable) {
    return (
      <span className={cn("tabular", quantity === 0 && "text-muted-foreground")}>
        {formatCount(quantity)}
        {guests > 0 && <span className="text-muted-foreground"> +{formatCount(guests)}</span>}
      </span>
    );
  }

  const commit = (field: "quantity" | "guests", input: HTMLInputElement) => {
    const value = input.value === "" ? 0 : Number(input.value);
    const max = field === "quantity" ? 5 : 10;
    const current = field === "quantity" ? quantity : guests;
    if (!isValidCount(value, max)) {
      input.value = String(current);
      return;
    }
    if (value === current) return;
    if (field === "quantity") onSave(value, guests);
    else onSave(quantity, value);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>, field: string) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    const next = document.querySelector<HTMLInputElement>(
      `[data-sheet-cell="${position.row + 1}:${position.col}:${field}"]`,
    );
    if (next) next.focus();
    else e.currentTarget.blur();
  };

  return (
    <div className="inline-flex items-center gap-1">
      <input
        key={`q${quantity}`}
        type="number"
        inputMode="decimal"
        min={0}
        max={5}
        step={0.5}
        defaultValue={quantity}
        aria-label={`${slot.name} meals for ${row.member.name}`}
        data-sheet-cell={`${position.row}:${position.col}:q`}
        onFocus={(e) => e.currentTarget.select()}
        onBlur={(e) => commit("quantity", e.currentTarget)}
        onKeyDown={(e) => onKeyDown(e, "q")}
        className={cn(
          "tabular h-9 w-14 [appearance:textfield] rounded-md border border-input bg-background text-center text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40 [&::-webkit-inner-spin-button]:appearance-none",
          quantity === 0 && "text-muted-foreground",
        )}
      />
      {allowGuests && (
        <label className="inline-flex items-center gap-0.5 text-xs text-muted-foreground">
          <span aria-hidden>+</span>
          <input
            key={`g${guests}`}
            type="number"
            inputMode="decimal"
            min={0}
            max={10}
            step={0.5}
            defaultValue={guests}
            aria-label={`${slot.name} guests for ${row.member.name}`}
            data-sheet-cell={`${position.row}:${position.col}:g`}
            onFocus={(e) => e.currentTarget.select()}
            onBlur={(e) => commit("guests", e.currentTarget)}
            onKeyDown={(e) => onKeyDown(e, "g")}
            className="tabular h-7 w-9 [appearance:textfield] rounded border border-transparent bg-transparent text-center text-xs outline-none hover:border-input focus-visible:border-ring focus-visible:bg-background focus-visible:ring-[3px] focus-visible:ring-ring/40 [&::-webkit-inner-spin-button]:appearance-none"
          />
        </label>
      )}
    </div>
  );
}
