"use client";

import { useState } from "react";
import { CircleAlert, ExternalLink, HandCoins, Pencil, Trash2, Wallet } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { MoneyText } from "@/components/common/money-text";
import { ResponsiveDialog } from "@/components/common/responsive-dialog";
import { StatusBadge } from "@/components/common/status-badge";
import { UserAvatar } from "@/components/common/user-avatar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useCurrentMess } from "@/features/messes/mess-context";
import { getErrorMessage } from "@/lib/api-error";
import { formatCount, formatDate } from "@/lib/format";
import { useApproveBazarMutation, useDeleteBazarMutation } from "../bazars-api";
import type { Bazar } from "../bazars-types";
import { BazarFormDialog } from "./bazar-form-dialog";
import { RejectBazarDialog } from "./reject-bazar-dialog";

export const PAID_FROM_LABELS = { MESS_FUND: "Mess fund", OWN_POCKET: "Own pocket" } as const;

/** A bazar in full: items, receipt and the actions the caller may take. */
export function BazarDetailDialog({
  bazar,
  open,
  onOpenChange,
}: {
  bazar: Bazar;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={
        <span className="flex items-center gap-2">
          <MoneyText value={bazar.totalAmount} className="text-xl" />
          <StatusBadge status={bazar.status} />
        </span>
      }
      description={`${bazar.shopper.name} · ${formatDate(bazar.date, "EEEE, d MMM yyyy")}`}
      className="max-h-[90svh] overflow-y-auto sm:max-w-lg"
    >
      <BazarDetail bazar={bazar} onClose={() => onOpenChange(false)} />
    </ResponsiveDialog>
  );
}

function BazarDetail({ bazar, onClose }: { bazar: Bazar; onClose: () => void }) {
  const mess = useCurrentMess();
  const [approve, { isLoading: approving }] = useApproveBazarMutation();
  const [deleteBazar] = useDeleteBazarMutation();
  const [rejecting, setRejecting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const PaidIcon = bazar.paidFrom === "MESS_FUND" ? Wallet : HandCoins;

  const onApprove = async () => {
    const res = await approve({ messId: mess.id, bazarId: bazar.id });
    if (res.error) return toast.error(getErrorMessage(res.error));
    toast.success("Bazar approved");
    onClose();
  };

  const onDelete = async () => {
    const res = await deleteBazar({ messId: mess.id, bazarId: bazar.id });
    if (res.error) {
      toast.error(getErrorMessage(res.error));
      throw res.error;
    }
    toast.success("Bazar deleted");
    onClose();
  };

  return (
    <div className="grid gap-5">
      {bazar.status === "REJECTED" && bazar.rejectionReason && (
        <Alert variant="destructive">
          <CircleAlert />
          <AlertTitle>Rejected{bazar.approvedBy && ` by ${bazar.approvedBy.name}`}</AlertTitle>
          <AlertDescription>{bazar.rejectionReason}</AlertDescription>
        </Alert>
      )}

      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div className="flex items-center gap-2">
          <UserAvatar name={bazar.shopper.name} src={bazar.shopper.avatarUrl} size="sm" />
          <div>
            <dt className="text-xs text-muted-foreground">Shopper</dt>
            <dd className="font-medium">{bazar.shopper.name}</dd>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <PaidIcon className="size-3.5" aria-hidden />
          </span>
          <div>
            <dt className="text-xs text-muted-foreground">Paid from</dt>
            <dd className="font-medium">{PAID_FROM_LABELS[bazar.paidFrom]}</dd>
          </div>
        </div>
      </dl>

      {bazar.items.length > 0 && (
        <div className="overflow-hidden rounded-lg border">
          <table className="w-full text-sm">
            <caption className="sr-only">Items</caption>
            <tbody className="divide-y">
              {bazar.items.map((item) => (
                <tr key={item.id}>
                  <td className="px-3 py-2">{item.name}</td>
                  <td className="tabular px-3 py-2 text-muted-foreground">
                    {item.quantity && `${formatCount(item.quantity)} ${item.unit ?? ""}`}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <MoneyText value={item.totalPrice} />
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t bg-muted/40 font-medium">
              <tr>
                <td className="px-3 py-2" colSpan={2}>
                  Total
                </td>
                <td className="px-3 py-2 text-right">
                  <MoneyText value={bazar.totalAmount} />
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {bazar.receiptUrl && (
        <a
          href={bazar.receiptUrl}
          target="_blank"
          rel="noreferrer"
          className="group relative block overflow-hidden rounded-lg border"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- short-lived signed URL */}
          <img src={bazar.receiptUrl} alt="Receipt" className="max-h-72 w-full bg-muted object-contain" />
          <span className="absolute right-2 bottom-2 flex items-center gap-1 rounded-md bg-background/90 px-2 py-1 text-xs font-medium shadow-sm">
            <ExternalLink className="size-3" aria-hidden />
            Open receipt
          </span>
        </a>
      )}

      {bazar.note && <p className="rounded-lg bg-muted/40 px-3 py-2 text-sm">{bazar.note}</p>}

      {bazar.status === "APPROVED" && bazar.approvedBy && (
        <p className="text-xs text-muted-foreground">
          Approved by {bazar.approvedBy.name}
          {bazar.approvedAt && ` on ${formatDate(bazar.approvedAt)}`}
        </p>
      )}

      {(bazar.canReview || bazar.canEdit || bazar.canDelete) && (
        <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:items-center">
          {bazar.canDelete && (
            <Button variant="ghost" className="text-destructive sm:mr-auto" onClick={() => setDeleting(true)}>
              <Trash2 />
              Delete
            </Button>
          )}
          {bazar.canEdit && (
            <BazarFormDialog
              bazar={bazar}
              trigger={(open) => (
                <Button variant="outline" onClick={open}>
                  <Pencil />
                  Edit
                </Button>
              )}
            />
          )}
          {bazar.canReview && (
            <>
              <Button variant="outline" onClick={() => setRejecting(true)}>
                Reject
              </Button>
              <Button onClick={onApprove} loading={approving}>
                Approve
              </Button>
            </>
          )}
        </div>
      )}

      <RejectBazarDialog bazar={bazar} open={rejecting} onOpenChange={setRejecting} onRejected={onClose} />
      <ConfirmDialog
        open={deleting}
        onOpenChange={setDeleting}
        title="Delete this bazar?"
        description="It's removed from the month's totals. This can't be undone."
        confirmLabel="Delete bazar"
        destructive
        onConfirm={onDelete}
      />
    </div>
  );
}
