"use client";

import { HandCoins, Receipt } from "lucide-react";
import { MoneyText } from "@/components/common/money-text";
import { StatusBadge } from "@/components/common/status-badge";
import { UserAvatar } from "@/components/common/user-avatar";
import { formatDay } from "@/lib/format";
import type { Bazar } from "../bazars-types";

/** "Rice, Eggs, Oil +3" */
export function itemsPreview(bazar: Bazar, max = 3) {
  if (bazar.items.length === 0) return bazar.note ?? "Total only";
  const names = bazar.items.slice(0, max).map((i) => i.name);
  const more = bazar.items.length - max;
  return `${names.join(", ")}${more > 0 ? ` +${more}` : ""}`;
}

/** One bazar in a list; the whole row opens it. */
export function BazarRow({ bazar, onOpen }: { bazar: Bazar; onOpen: () => void }) {
  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors duration-150 outline-none hover:bg-muted/40 focus-visible:bg-muted/40 sm:px-6"
      >
        <UserAvatar name={bazar.shopper.name} src={bazar.shopper.avatarUrl} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 text-sm">
            <span className="truncate font-medium">{bazar.shopper.name}</span>
            <span className="shrink-0 text-muted-foreground">· {formatDay(bazar.date)}</span>
          </p>
          <p className="flex items-center gap-1.5 truncate text-xs text-muted-foreground">
            {bazar.receiptUrl && <Receipt className="size-3 shrink-0" aria-label="Has receipt" />}
            {bazar.paidFrom === "OWN_POCKET" && (
              <HandCoins className="size-3 shrink-0" aria-label="Paid from own pocket" />
            )}
            <span className="truncate">{itemsPreview(bazar)}</span>
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <MoneyText value={bazar.totalAmount} className="font-semibold" />
          {bazar.status !== "APPROVED" && <StatusBadge status={bazar.status} />}
        </div>
      </button>
    </li>
  );
}
