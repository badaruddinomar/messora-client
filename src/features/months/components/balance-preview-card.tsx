"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Info } from "lucide-react";
import { MoneyText } from "@/components/common/money-text";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { messRoutes } from "@/constants/routes";
import { useCurrentMess } from "@/features/messes/mess-context";
import { formatCount, formatMoney, isNegative, isZero } from "@/lib/format";
import { subtractMoney } from "@/lib/money";
import { useMonthPreviewQuery, useMonthsQuery } from "../months-api";
import { monthLabel } from "../utils";

/**
 * "Your balance so far" for the current month: deposits minus your share of costs, from what's
 * approved today. An estimate until the month is closed (BUSINESS_RULES §8).
 */
export function BalancePreviewCard() {
  const mess = useCurrentMess();
  const { data: months } = useMonthsQuery(mess.id);
  const month = months?.find((m) => m.isCurrent);
  const { data: preview } = useMonthPreviewQuery(
    { messId: mess.id, monthId: month?.id ?? "" },
    { skip: !month },
  );
  const me = preview?.members.find((m) => m.member.isYou);
  const otherCharges = me ? subtractMoney(me.chargeTotal, me.seatRentEstimate) : "0";

  return (
    <Card>
      <CardHeader>
        <CardDescription>Your balance so far</CardDescription>
        <CardTitle className="text-2xl tracking-tight">
          {me ? <MoneyText value={me.closingBalance} variant="balance" /> : <Skeleton className="h-8 w-32" />}
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        {me && preview ? (
          <dl className="grid gap-2 text-sm">
            {!isZero(me.openingBalance) && (
              <Line label="Carried from last month">
                <MoneyText value={me.openingBalance} variant="balance" />
              </Line>
            )}
            <Line label="Your deposits">
              <MoneyText value={me.totalDeposit} />
            </Line>
            <Line label={`Meals: ${formatCount(me.weightedMeals)} × ${formatMoney(preview.totals.mealRate)}`}>
              −<MoneyText value={me.mealCost} />
            </Line>
            {!isZero(me.sharedCost) && (
              <Line label="Shared costs">
                −<MoneyText value={me.sharedCost} />
              </Line>
            )}
            {!isZero(me.seatRentEstimate) && (
              <Line label="Seat rent">
                −<MoneyText value={me.seatRentEstimate} />
              </Line>
            )}
            {!isZero(otherCharges) && (
              <Line label={isNegative(otherCharges) ? "Taken off your bill" : "Other charges"}>
                {isNegative(otherCharges) ? "+" : "−"}
                <MoneyText value={otherCharges.replace("-", "")} />
              </Line>
            )}
          </dl>
        ) : (
          <Skeleton className="h-20" />
        )}
        <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
          <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          <span>
            An estimate until {month ? monthLabel(month) : "the month"} is closed: the meal rate changes as
            bazar and meals are added.{" "}
            <Link href={messRoutes(mess.slug).months} className="font-medium text-foreground hover:underline">
              See everyone
            </Link>
          </span>
        </p>
      </CardContent>
    </Card>
  );
}

function Line({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="tabular font-medium">{children}</dd>
    </div>
  );
}
