"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ResponsiveDialog } from "@/components/common/responsive-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCurrentMess } from "@/features/messes/mess-context";
import { getErrorMessage } from "@/lib/api-error";
import { formatMoney } from "@/lib/format";
import { useRejectBazarMutation } from "../bazars-api";
import type { Bazar } from "../bazars-types";

/** Rejecting needs a reason, so the shopper can fix it and resubmit (BUSINESS_RULES §10). */
export function RejectBazarDialog({
  bazar,
  open,
  onOpenChange,
  onRejected,
}: {
  bazar: Bazar;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRejected?: () => void;
}) {
  const mess = useCurrentMess();
  const [reject, { isLoading }] = useRejectBazarMutation();
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string>();

  const submit = async () => {
    if (reason.trim().length < 3) return setError("Say why, so they can fix it");
    const res = await reject({ messId: mess.id, bazarId: bazar.id, reason: reason.trim() });
    if (res.error) return setError(getErrorMessage(res.error));
    toast.success("Bazar rejected", { description: `${bazar.shopper.name} can fix it and send it again.` });
    onOpenChange(false);
    onRejected?.();
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Reject this bazar?"
      description={`${bazar.shopper.name}'s ${formatMoney(bazar.totalAmount)} bazar won't count until it's fixed.`}
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={submit} loading={isLoading}>
            Reject bazar
          </Button>
        </>
      }
    >
      <div className="grid gap-2">
        <Label htmlFor="reject-reason">Reason</Label>
        <Textarea
          id="reject-reason"
          rows={3}
          maxLength={300}
          placeholder="The receipt says ৳1,200, not ৳1,500"
          value={reason}
          aria-invalid={!!error}
          onChange={(e) => {
            setReason(e.target.value);
            setError(undefined);
          }}
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    </ResponsiveDialog>
  );
}
