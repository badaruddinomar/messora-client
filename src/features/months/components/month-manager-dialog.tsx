"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ResponsiveDialog } from "@/components/common/responsive-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMembersQuery } from "@/features/members/members-api";
import { useCurrentMess } from "@/features/messes/mess-context";
import { getErrorMessage } from "@/lib/api-error";
import { useSetMonthManagerMutation } from "../months-api";
import type { Month } from "../months-types";
import { monthLabel } from "../utils";

const NONE = "none";

/** Admins pick which member manages a month (they get manager powers while it's open). */
export function MonthManagerDialog({
  month,
  open,
  onOpenChange,
}: {
  month: Month;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const mess = useCurrentMess();
  const { data: members } = useMembersQuery({ messId: mess.id });
  const [setManager, { isLoading }] = useSetMonthManagerMutation();
  const [value, setValue] = useState(month.manager?.memberId ?? NONE);

  const save = async () => {
    const managerId = value === NONE ? null : value;
    const res = await setManager({ messId: mess.id, monthId: month.id, managerId });
    if (res.error) return toast.error(getErrorMessage(res.error));
    toast.success(
      res.data.manager
        ? `${res.data.manager.name} manages ${monthLabel(month)}`
        : `${monthLabel(month)} has no manager now`,
    );
    onOpenChange(false);
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Manager for ${monthLabel(month)}`}
      description="They can handle meals, bazar and deposits for this month, even if they're a regular member."
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={save} loading={isLoading} disabled={value === (month.manager?.memberId ?? NONE)}>
            Save
          </Button>
        </>
      }
    >
      <div className="grid gap-2">
        <Label htmlFor="month-manager">Month manager</Label>
        <Select value={value} onValueChange={setValue}>
          <SelectTrigger id="month-manager">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>No month manager</SelectItem>
            {members?.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.user.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </ResponsiveDialog>
  );
}
