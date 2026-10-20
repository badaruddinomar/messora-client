"use client";

import { useState, type ReactNode } from "react";
import { ResponsiveDialog } from "@/components/common/responsive-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface RejectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  /** Names the action, e.g. "Reject bazar". */
  confirmLabel: string;
  placeholder?: string;
  /** Resolves to an error message to show, or nothing on success (the dialog then closes). */
  onReject: (reason: string) => Promise<string | void>;
}

/** Rejecting needs a reason, so the member can fix the entry and resubmit (BUSINESS_RULES §10). */
export function RejectDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  placeholder,
  onReject,
}: RejectDialogProps) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);

  const submit = async () => {
    if (reason.trim().length < 3) return setError("Say why, so they can fix it");
    setPending(true);
    const failure = await onReject(reason.trim());
    setPending(false);
    if (failure) return setError(failure);
    onOpenChange(false);
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={(next) => !pending && onOpenChange(next)}
      title={title}
      description={description}
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={submit} loading={pending}>
            {confirmLabel}
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
          placeholder={placeholder}
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
