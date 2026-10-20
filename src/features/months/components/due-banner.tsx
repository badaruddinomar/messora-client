"use client";

import Link from "next/link";
import { HandCoins } from "lucide-react";
import { MoneyText } from "@/components/common/money-text";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { messRoutes } from "@/constants/routes";
import { useCurrentMess, useMessPermissions } from "@/features/messes/mess-context";
import { isMoney } from "@/lib/money";
import { useMonthsQuery, useSettlementsQuery } from "../months-api";
import { monthLabel } from "../utils";

const nonZero = (value: string) => isMoney(value) && Number(value) !== 0;

/**
 * What's still to settle from the last closed month: your own due or refund, and for managers what's
 * left to collect and pay out. Hidden once everything is settled or carried over.
 */
export function DueBanner() {
  const mess = useCurrentMess();
  const { canManage } = useMessPermissions();
  const routes = messRoutes(mess.slug);
  const { data: months } = useMonthsQuery(mess.id);
  const lastClosed = months?.find((m) => m.status === "CLOSED");
  const { data } = useSettlementsQuery(
    { messId: mess.id, monthId: lastClosed?.id ?? "" },
    { skip: !lastClosed },
  );
  if (!lastClosed || !data?.collectable) return null;

  const mine = data.rows.find((r) => r.member.id === mess.membership.id && !r.isSettled && !r.carriedOver);
  const label = monthLabel(lastClosed);
  const left = canManage && (nonZero(data.totals.dueToMess) || nonZero(data.totals.owedToMembers));

  if (mine?.direction) {
    const owes = mine.direction === "MEMBER_TO_MESS";
    return (
      <Alert variant={owes ? "warning" : "info"}>
        <HandCoins />
        <AlertTitle>
          {owes ? "You owe the mess " : "The mess owes you "}
          <MoneyText value={mine.remaining} className="text-current" /> from {label}
        </AlertTitle>
        <AlertDescription className="flex flex-wrap items-center gap-x-3 gap-y-2 text-current/80">
          {owes
            ? "Pay the manager to settle it before the next month closes."
            : "The manager will pay it back from the mess fund."}
          <span className="flex gap-2">
            <Button size="sm" variant="outline" asChild>
              <Link href={routes.bill(lastClosed.id)}>See my bill</Link>
            </Button>
            {left && (
              <Button size="sm" variant="ghost" asChild>
                <Link href={`${routes.month(lastClosed.id)}?tab=settle`}>Settle up</Link>
              </Button>
            )}
          </span>
        </AlertDescription>
      </Alert>
    );
  }

  if (!left) return null;
  return (
    <Alert variant="info">
      <HandCoins />
      <AlertTitle>{label} isn&apos;t settled yet</AlertTitle>
      <AlertDescription className="flex flex-wrap items-center gap-x-3 gap-y-2 text-current/80">
        <span>
          <MoneyText value={data.totals.dueToMess} className="text-current" /> to collect ·{" "}
          <MoneyText value={data.totals.owedToMembers} className="text-current" /> to pay back
        </span>
        <Button size="sm" variant="outline" asChild>
          <Link href={`${routes.month(lastClosed.id)}?tab=settle`}>Settle up</Link>
        </Button>
      </AlertDescription>
    </Alert>
  );
}
