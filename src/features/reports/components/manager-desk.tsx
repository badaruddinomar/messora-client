"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ChevronRight,
  CircleCheck,
  HandCoins,
  MessageSquareText,
  ShoppingBasket,
  UserPlus,
  Wallet,
} from "lucide-react";
import { MoneyText } from "@/components/common/money-text";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { messRoutes } from "@/constants/routes";
import { useCurrentMess } from "@/features/messes/mess-context";
import { monthLabel } from "@/features/months/utils";
import { cn } from "@/lib/cn";
import { formatMoney, formatSignedMoney, isNegative } from "@/lib/format";
import type { Dashboard, ManagerDashboard } from "../reports-types";

const SHOWN_BALANCES = 5;

/**
 * The manager's answers at a glance (ROADMAP Phase 9 "done when"): how much cash the mess holds,
 * what's waiting for them, and who owes what so far, without opening other pages.
 */
export function ManagerDesk({ dashboard }: { dashboard?: Dashboard }) {
  const mess = useCurrentMess();
  const routes = messRoutes(mess.slug);
  const desk = dashboard?.manager;

  if (!dashboard || !desk) return <Skeleton className="h-72 rounded-xl" />;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your desk</CardTitle>
        <CardDescription>{monthLabel(dashboard.month)} so far, as it stands now.</CardDescription>
        <CardAction>
          <Button variant="ghost" size="sm" asChild>
            <Link href={routes.reports}>
              Reports
              <ChevronRight />
            </Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="grid content-start gap-6">
          <section aria-labelledby="cash-in-hand">
            <p id="cash-in-hand" className="text-sm text-muted-foreground">
              Cash in hand
            </p>
            <p
              className={cn(
                "text-5xl font-semibold tracking-tight",
                isNegative(desk.cashInHand) && "text-destructive",
              )}
            >
              {formatSignedMoney(desk.cashInHand)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {isNegative(desk.cashInHand)
                ? "The fund has paid out more than it took in. Collect deposits."
                : "Deposits and payments in, minus what the mess fund paid."}
            </p>
          </section>
          <Waiting pending={desk.pending} />
        </div>
        <WhoOwes dashboard={dashboard} desk={desk} />
      </CardContent>
    </Card>
  );
}

function Waiting({ pending }: { pending: ManagerDashboard["pending"] }) {
  const mess = useCurrentMess();
  const routes = messRoutes(mess.slug);
  const items: { icon: LucideIcon; label: string; href: string; count: number }[] = [
    {
      icon: ShoppingBasket,
      count: pending.bazars.count,
      label: `${pending.bazars.count} ${pending.bazars.count === 1 ? "bazar" : "bazars"} · ${formatMoney(pending.bazars.total)}`,
      href: `${routes.bazar}?tab=review`,
    },
    {
      icon: Wallet,
      count: pending.deposits.count,
      label: `${pending.deposits.count} ${pending.deposits.count === 1 ? "deposit" : "deposits"} · ${formatMoney(pending.deposits.total)}`,
      href: `${routes.deposits}?tab=review`,
    },
    {
      icon: UserPlus,
      count: pending.joinRequests,
      label: `${pending.joinRequests} ${pending.joinRequests === 1 ? "person wants" : "people want"} to join`,
      href: `${routes.members}?tab=requests`,
    },
    {
      icon: MessageSquareText,
      count: pending.mealRequests,
      label: `${pending.mealRequests} meal ${pending.mealRequests === 1 ? "request" : "requests"}`,
      href: `${routes.meals}?tab=requests`,
    },
  ].filter((i) => i.count > 0);

  return (
    <section aria-labelledby="waiting" className="grid gap-2">
      <h3 id="waiting" className="text-sm font-medium">
        Waiting for you
      </h3>
      {items.length === 0 ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <CircleCheck className="size-4 text-success" aria-hidden />
          Nothing to approve right now.
        </p>
      ) : (
        <ul className="grid gap-1">
          {items.map(({ icon: Icon, label, href }) => (
            <li key={href}>
              <Link
                href={href}
                className="flex items-center gap-3 rounded-lg border px-3 py-2 text-sm transition-colors hover:bg-muted/50"
              >
                <Icon className="size-4 text-muted-foreground" aria-hidden />
                <span className="flex-1">{label}</span>
                <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function WhoOwes({ dashboard, desk }: { dashboard: Dashboard; desk: ManagerDashboard }) {
  const mess = useCurrentMess();
  const routes = messRoutes(mess.slug);
  const owing = desk.balances.filter((b) => isNegative(b.balance));
  const shown = owing.slice(0, SHOWN_BALANCES);
  const closed = desk.lastClosed;
  const closedLeft =
    closed && closed.collectable && (Number(closed.dueToMess) > 0 || Number(closed.owedToMembers) > 0);

  return (
    <section aria-labelledby="who-owes" className="grid content-start gap-3">
      <div className="flex items-baseline justify-between gap-2">
        <h3 id="who-owes" className="text-sm font-medium">
          Who owes what so far
        </h3>
        <Link
          href={routes.month(dashboard.month.id)}
          className="text-xs font-medium text-primary hover:underline"
        >
          See everyone
        </Link>
      </div>
      <dl className="grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-lg bg-muted/40 px-3 py-2">
          <dt className="text-xs text-muted-foreground">Members owe</dt>
          <dd className="tabular font-semibold">{formatMoney(desk.dueSoFar)}</dd>
        </div>
        <div className="rounded-lg bg-muted/40 px-3 py-2">
          <dt className="text-xs text-muted-foreground">The mess owes</dt>
          <dd className="tabular font-semibold">{formatMoney(desk.creditSoFar)}</dd>
        </div>
      </dl>
      {shown.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nobody owes anything so far.</p>
      ) : (
        <ul className="divide-y">
          {shown.map((b) => (
            <li key={b.member.id} className="flex items-center justify-between gap-3 py-2 text-sm">
              <Link href={routes.bill(dashboard.month.id, b.member.id)} className="truncate hover:underline">
                {b.member.name}
              </Link>
              <MoneyText value={b.balance} variant="balance" className="font-medium" />
            </li>
          ))}
          {owing.length > shown.length && (
            <li className="py-2 text-xs text-muted-foreground">
              and {owing.length - shown.length} more owe the mess
            </li>
          )}
        </ul>
      )}
      {closed && closedLeft && (
        <>
          <Separator />
          <Link
            href={`${routes.month(closed.id)}?tab=settle`}
            className="flex items-start gap-3 rounded-lg border px-3 py-2 text-sm transition-colors hover:bg-muted/50"
          >
            <HandCoins className="mt-0.5 size-4 text-muted-foreground" aria-hidden />
            <span className="flex-1">
              <span className="font-medium">{monthLabel(closed)} isn&apos;t settled</span>
              <span className="block text-xs text-muted-foreground">
                {formatMoney(closed.dueToMess)} to collect · {formatMoney(closed.owedToMembers)} to pay back ·{" "}
                {closed.unsettled} {closed.unsettled === 1 ? "member" : "members"}
              </span>
            </span>
            <ChevronRight className="mt-0.5 size-4 text-muted-foreground" aria-hidden />
          </Link>
        </>
      )}
    </section>
  );
}
