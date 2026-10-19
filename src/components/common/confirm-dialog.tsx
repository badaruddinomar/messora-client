"use client";

import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { ResponsiveDialog } from "./responsive-dialog";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  /** Names the action, e.g. "Close October" — never "OK" (DESIGN_SYSTEM §6). */
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  /** May be async; the dialog shows a pending state and closes when it resolves. */
  onConfirm: () => unknown | Promise<unknown>;
}

/** Confirmation for destructive or irreversible actions. */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  destructive = false,
  onConfirm,
}: ConfirmDialogProps) {
  const [pending, setPending] = useState(false);

  const confirm = async () => {
    setPending(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } finally {
      setPending(false);
    }
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
            {cancelLabel}
          </Button>
          <Button variant={destructive ? "destructive" : "default"} onClick={confirm} loading={pending}>
            {confirmLabel}
          </Button>
        </>
      }
    />
  );
}
