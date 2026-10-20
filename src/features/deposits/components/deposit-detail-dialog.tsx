"use client";

import { useState } from "react";
import { CircleAlert, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { MoneyText } from "@/components/common/money-text";
import { RejectDialog } from "@/components/common/reject-dialog";
import { ResponsiveDialog } from "@/components/common/responsive-dialog";
import { StatusBadge } from "@/components/common/status-badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useCurrentMess } from "@/features/messes/mess-context";
import { getErrorMessage } from "@/lib/api-error";
import { formatDate, formatMoney } from "@/lib/format";
import {
  useApproveDepositMutation,
  useDeleteDepositMutation,
  useRejectDepositMutation,
} from "../deposits-api";
import { methodLabel, type Deposit } from "../deposits-types";
import { DepositFormDialog } from "./deposit-form-dialog";

/** Reject a deposit with a reason the member sees. */
export function RejectDepositDialog({
  deposit,
  open,
  onOpenChange,
  onRejected,
}: {
  deposit: Deposit;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRejected?: () => void;
}) {
  const mess = useCurrentMess();
  const [reject] = useRejectDepositMutation();
  return (
    <RejectDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Reject this deposit?"
      description={`${deposit.member.name}'s ${formatMoney(deposit.amount)} won't count until it's fixed.`}
      confirmLabel="Reject deposit"
      placeholder="I haven't received this on bKash"
      onReject={async (reason) => {
        const res = await reject({ messId: mess.id, depositId: deposit.id, reason });
        if (res.error) return getErrorMessage(res.error);
        toast.success("Deposit rejected");
        onRejected?.();
      }}
    />
  );
}

export function DepositDetailDialog({
  deposit,
  open,
  onOpenChange,
}: {
  deposit: Deposit;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const mess = useCurrentMess();
  const [approve, { isLoading: approving }] = useApproveDepositMutation();
  const [deleteDeposit] = useDeleteDepositMutation();
  const [rejecting, setRejecting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const close = () => onOpenChange(false);

  const onApprove = async () => {
    const res = await approve({ messId: mess.id, depositId: deposit.id });
    if (res.error) return toast.error(getErrorMessage(res.error));
    toast.success("Deposit confirmed");
    close();
  };
  const onDelete = async () => {
    const res = await deleteDeposit({ messId: mess.id, depositId: deposit.id });
    if (res.error) {
      toast.error(getErrorMessage(res.error));
      throw res.error;
    }
    toast.success("Deposit deleted");
    close();
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={
        <span className="flex items-center gap-2">
          <MoneyText value={deposit.amount} className="text-xl" />
          <StatusBadge status={deposit.status} />
        </span>
      }
      description={`${deposit.member.name} · ${formatDate(deposit.date, "EEEE, d MMM yyyy")}`}
    >
      <div className="grid gap-5">
        {deposit.status === "REJECTED" && deposit.rejectionReason && (
          <Alert variant="destructive">
            <CircleAlert />
            <AlertTitle>Rejected{deposit.receivedBy && ` by ${deposit.receivedBy.name}`}</AlertTitle>
            <AlertDescription>{deposit.rejectionReason}</AlertDescription>
          </Alert>
        )}
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <div>
            <dt className="text-xs text-muted-foreground">Paid by</dt>
            <dd className="font-medium">{methodLabel(deposit.method)}</dd>
          </div>
          {deposit.transactionRef && (
            <div>
              <dt className="text-xs text-muted-foreground">Transaction ID</dt>
              <dd className="font-mono font-medium break-all">{deposit.transactionRef}</dd>
            </div>
          )}
          {deposit.status === "APPROVED" && (
            <div>
              <dt className="text-xs text-muted-foreground">Received by</dt>
              <dd className="font-medium">{deposit.receivedBy?.name ?? "Recorded without approval"}</dd>
            </div>
          )}
        </dl>
        {deposit.note && <p className="rounded-lg bg-muted/40 px-3 py-2 text-sm">{deposit.note}</p>}

        {(deposit.canReview || deposit.canEdit || deposit.canDelete) && (
          <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:items-center">
            {deposit.canDelete && (
              <Button
                variant="ghost"
                className="text-destructive sm:mr-auto"
                onClick={() => setDeleting(true)}
              >
                <Trash2 />
                Delete
              </Button>
            )}
            {deposit.canEdit && (
              <DepositFormDialog
                deposit={deposit}
                trigger={(open) => (
                  <Button variant="outline" onClick={open}>
                    <Pencil />
                    Edit
                  </Button>
                )}
              />
            )}
            {deposit.canReview && (
              <>
                <Button variant="outline" onClick={() => setRejecting(true)}>
                  Reject
                </Button>
                <Button onClick={onApprove} loading={approving}>
                  Confirm received
                </Button>
              </>
            )}
          </div>
        )}
        <RejectDepositDialog
          deposit={deposit}
          open={rejecting}
          onOpenChange={setRejecting}
          onRejected={close}
        />
        <ConfirmDialog
          open={deleting}
          onOpenChange={setDeleting}
          title="Delete this deposit?"
          description="It's removed from the member's balance. This can't be undone."
          confirmLabel="Delete deposit"
          destructive
          onConfirm={onDelete}
        />
      </div>
    </ResponsiveDialog>
  );
}
