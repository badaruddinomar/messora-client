"use client";

import { useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { DatePicker } from "@/components/common/date-picker";
import { ResponsiveDialog } from "@/components/common/responsive-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMembersQuery } from "@/features/members/members-api";
import { useCurrentMess } from "@/features/messes/mess-context";
import type { Month } from "@/features/months/months-types";
import { getErrorMessage } from "@/lib/api-error";
import { formatDate } from "@/lib/format";
import { useAddDutyMutation, useSwapDutiesMutation, useUpdateDutyMutation } from "../bazars-api";
import type { BazarDuty } from "../bazars-types";

export type DutyAction = { kind: "add" } | { kind: "move" | "reassign" | "swap"; duty: BazarDuty };

const TITLES = {
  add: "Add bazar duty",
  move: "Move to another day",
  reassign: "Give to someone else",
  swap: "Swap with",
};

/** Add a duty, or move, reassign or swap one (managers). */
export function DutyActionDialog({
  action,
  month,
  duties,
  onClose,
}: {
  action: DutyAction;
  month: Month;
  duties: BazarDuty[];
  onClose: () => void;
}) {
  const mess = useCurrentMess();
  const { data: members } = useMembersQuery({ messId: mess.id });
  const [addDuty, add] = useAddDutyMutation();
  const [updateDuty, update] = useUpdateDutyMutation();
  const [swapDuties, swap] = useSwapDutiesMutation();
  const duty = action.kind === "add" ? undefined : action.duty;
  const [date, setDate] = useState(duty?.date ?? "");
  const [memberId, setMemberId] = useState("");
  const [otherId, setOtherId] = useState("");
  const [error, setError] = useState<string>();

  const swapOptions = duty
    ? duties.filter((d) => !d.isDone && d.member.id !== duty.member.id && d.date !== duty.date)
    : [];
  const ready =
    action.kind === "swap"
      ? !!otherId
      : action.kind === "move"
        ? !!date && date !== duty?.date
        : !!memberId && (action.kind === "reassign" || !!date);

  const submit = async () => {
    setError(undefined);
    const res =
      action.kind === "add"
        ? await addDuty({ messId: mess.id, date, memberId })
        : action.kind === "move"
          ? await updateDuty({ messId: mess.id, dutyId: action.duty.id, date })
          : action.kind === "reassign"
            ? await updateDuty({ messId: mess.id, dutyId: action.duty.id, memberId })
            : await swapDuties({ messId: mess.id, dutyId: action.duty.id, otherDutyId: otherId });
    if (res.error) return setError(getErrorMessage(res.error));
    toast.success(
      action.kind === "add"
        ? "Bazar duty added"
        : action.kind === "swap"
          ? "Duties swapped"
          : "Bazar duty updated",
    );
    onClose();
  };

  const inMonth = (day: Date) => {
    const d = format(day, "yyyy-MM-dd");
    return d < month.startDate || d > month.endDate;
  };

  return (
    <ResponsiveDialog
      open
      onOpenChange={(open) => !open && onClose()}
      title={TITLES[action.kind]}
      description={duty && `${duty.member.name}'s duty on ${formatDate(duty.date, "EEE, d MMM")}`}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={submit}
            disabled={!ready}
            loading={add.isLoading || update.isLoading || swap.isLoading}
          >
            {action.kind === "swap" ? "Swap duties" : "Save"}
          </Button>
        </>
      }
    >
      <div className="grid gap-4">
        {(action.kind === "add" || action.kind === "move") && (
          <div className="grid gap-2">
            <Label>Day</Label>
            <DatePicker value={date} onChange={(v) => setDate(v ?? "")} isDisabledDay={inMonth} />
          </div>
        )}
        {(action.kind === "add" || action.kind === "reassign") && (
          <div className="grid gap-2">
            <Label htmlFor="duty-member">Member</Label>
            <Select value={memberId} onValueChange={setMemberId}>
              <SelectTrigger id="duty-member" className="w-full">
                <SelectValue placeholder="Pick a member" />
              </SelectTrigger>
              <SelectContent>
                {members
                  ?.filter((m) => m.id !== duty?.member.id)
                  .map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.user.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        )}
        {action.kind === "swap" &&
          (swapOptions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No other upcoming duties to swap with.</p>
          ) : (
            <div className="grid gap-2">
              <Label htmlFor="duty-swap">Their duty</Label>
              <Select value={otherId} onValueChange={setOtherId}>
                <SelectTrigger id="duty-swap" className="w-full">
                  <SelectValue placeholder="Pick a duty" />
                </SelectTrigger>
                <SelectContent>
                  {swapOptions.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.member.name} · {formatDate(d.date, "EEE, d MMM")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    </ResponsiveDialog>
  );
}
