"use client";

import { useState, type ReactNode } from "react";
import { format } from "date-fns";
import { CircleAlert } from "lucide-react";
import { toast } from "sonner";
import { DatePicker } from "@/components/common/date-picker";
import { ResponsiveDialog } from "@/components/common/responsive-dialog";
import { UserAvatar } from "@/components/common/user-avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMembersQuery } from "@/features/members/members-api";
import { useCurrentMess } from "@/features/messes/mess-context";
import type { Month } from "@/features/months/months-types";
import { monthLabel } from "@/features/months/utils";
import { getErrorMessage, type RequestError } from "@/lib/api-error";
import { cn } from "@/lib/cn";
import { datesBetween, todayIn } from "@/lib/date";
import { formatDate } from "@/lib/format";
import { usePlanDutiesMutation } from "../bazars-api";

const EVERY = [1, 2, 3, 4, 5, 6, 7];

/**
 * Plans the month's bazar duty: members take turns in the order they're picked, on a bazar day every
 * N days. Upcoming duties that aren't done are replaced.
 */
export function PlanRotationDialog({
  month,
  trigger,
}: {
  month: Month;
  trigger: (open: () => void) => ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      {trigger(() => setOpen(true))}
      <ResponsiveDialog
        open={open}
        onOpenChange={setOpen}
        title={`Plan bazar duty for ${monthLabel(month)}`}
        description="Tap members in the order they should take turns. Upcoming duties that aren't done are replaced."
        className="max-h-[90svh] overflow-y-auto sm:max-w-lg"
      >
        {open && <PlanForm month={month} onDone={() => setOpen(false)} />}
      </ResponsiveDialog>
    </>
  );
}

function PlanForm({ month, onDone }: { month: Month; onDone: () => void }) {
  const mess = useCurrentMess();
  const { data: members } = useMembersQuery({ messId: mess.id });
  const [plan, { isLoading }] = usePlanDutiesMutation();
  const today = todayIn(mess.timezone);
  const [order, setOrder] = useState<string[]>([]);
  const [everyDays, setEveryDays] = useState(1);
  const [perDay, setPerDay] = useState(1);
  const [fromDate, setFromDate] = useState(today > month.startDate ? today : month.startDate);
  const [error, setError] = useState<RequestError | string>();

  const toggle = (id: string) => setOrder((o) => (o.includes(id) ? o.filter((x) => x !== id) : [...o, id]));
  const days =
    fromDate <= month.endDate ? Math.ceil(datesBetween(fromDate, month.endDate).length / everyDays) : 0;

  const submit = async () => {
    if (order.length === 0) return setError("Pick at least one member");
    const res = await plan({
      messId: mess.id,
      monthId: month.id,
      memberIds: order,
      everyDays,
      perDay,
      fromDate,
    });
    if (res.error) return setError(res.error);
    toast.success("Bazar duty planned", { description: "Everyone with duty gets a notification." });
    onDone();
  };

  return (
    <div className="grid gap-5">
      {error && (
        <Alert variant="destructive">
          <CircleAlert />
          <AlertDescription>{typeof error === "string" ? error : getErrorMessage(error)}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-2">
        <Label>Turn order</Label>
        <ul className="grid gap-2">
          {members?.map((m) => {
            const position = order.indexOf(m.id);
            const picked = position >= 0;
            return (
              <li key={m.id}>
                <button
                  type="button"
                  aria-pressed={picked}
                  onClick={() => toggle(m.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left text-sm transition-colors duration-150 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40",
                    picked ? "border-primary bg-primary/[0.04]" : "hover:bg-muted/40",
                  )}
                >
                  <span
                    className={cn(
                      "tabular flex size-6 items-center justify-center rounded-full text-xs font-semibold",
                      picked ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                    )}
                  >
                    {picked ? position + 1 : ""}
                  </span>
                  <UserAvatar name={m.user.name} src={m.user.avatarUrl} size="sm" />
                  <span className="flex-1 font-medium">{m.user.name}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="every-days">Bazar day</Label>
          <Select value={String(everyDays)} onValueChange={(v) => setEveryDays(Number(v))}>
            <SelectTrigger id="every-days" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EVERY.map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n === 1 ? "Every day" : `Every ${n} days`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="per-day">Shoppers per day</Label>
          <Select value={String(perDay)} onValueChange={(v) => setPerDay(Number(v))}>
            <SelectTrigger id="per-day" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3].map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-2">
        <Label>Starting from</Label>
        <DatePicker
          value={fromDate}
          onChange={(v) => v && setFromDate(v)}
          isDisabledDay={(day) => {
            const d = format(day, "yyyy-MM-dd");
            return d < month.startDate || d > month.endDate;
          }}
        />
        <p className="text-xs text-muted-foreground">
          {days} bazar {days === 1 ? "day" : "days"} until {formatDate(month.endDate, "d MMM")}.
        </p>
      </div>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="outline" onClick={onDone}>
          Cancel
        </Button>
        <Button onClick={submit} loading={isLoading} disabled={order.length === 0}>
          Plan duty
        </Button>
      </div>
    </div>
  );
}
