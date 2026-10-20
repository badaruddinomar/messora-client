"use client";

import { toast } from "sonner";
import { RejectDialog } from "@/components/common/reject-dialog";
import { useCurrentMess } from "@/features/messes/mess-context";
import { getErrorMessage } from "@/lib/api-error";
import { formatMoney } from "@/lib/format";
import { useRejectBazarMutation } from "../bazars-api";
import type { Bazar } from "../bazars-types";

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
  const [reject] = useRejectBazarMutation();

  return (
    <RejectDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Reject this bazar?"
      description={`${bazar.shopper.name}'s ${formatMoney(bazar.totalAmount)} bazar won't count until it's fixed.`}
      confirmLabel="Reject bazar"
      placeholder="The receipt says ৳1,200, not ৳1,500"
      onReject={async (reason) => {
        const res = await reject({ messId: mess.id, bazarId: bazar.id, reason });
        if (res.error) return getErrorMessage(res.error);
        toast.success("Bazar rejected", {
          description: `${bazar.shopper.name} can fix it and send it again.`,
        });
        onRejected?.();
      }}
    />
  );
}
