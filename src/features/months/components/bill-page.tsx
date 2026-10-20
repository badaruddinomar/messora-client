"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronLeft, FileText, Info } from "lucide-react";
import { EmptyState } from "@/components/common/empty-state";
import { MoneyText } from "@/components/common/money-text";
import { UserAvatar } from "@/components/common/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { messRoutes } from "@/constants/routes";
import { methodLabel } from "@/features/deposits/deposits-types";
import {
  CATEGORY_LABELS,
  CHARGE_LABELS,
  type ChargeType,
  type ExpenseCategory,
} from "@/features/expenses/expenses-types";
import { useCurrentMess } from "@/features/messes/mess-context";
import { cn } from "@/lib/cn";
import { formatCount, formatDate, formatMoney, isNegative, isZero } from "@/lib/format";
import { useStatementQuery } from "../months-api";
import type { Statement } from "../months-types";
import { monthLabel } from "../utils";

/** A member's bill for a month, line by line: "why do I owe this?". */
export function BillPage() {
  const { monthId, memberId } = useParams<{ monthId: string; memberId: string }>();
  const mess = useCurrentMess();
  const { data, isLoading, error } = useStatementQuery({ messId: mess.id, monthId, memberId });

  return (
    <div className="mx-auto grid w-full max-w-2xl gap-6">
      <Button variant="ghost" size="sm" className="-ml-2 w-fit" asChild>
        <Link href={messRoutes(mess.slug).month(monthId)}>
          <ChevronLeft />
          Back to the month
        </Link>
      </Button>
      {error ? (
        <EmptyState
          icon={FileText}
          title="No bill here"
          description="This member wasn't part of that month, or it isn't yours to see."
        />
      ) : isLoading || !data ? (
        <Skeleton className="h-[32rem] rounded-xl" />
      ) : (
        <Bill statement={data} />
      )}
    </div>
  );
}

function Bill({ statement: s }: { statement: Statement }) {
  const t = s.totals;
  const costs = [t.mealCost, t.sharedCost, t.chargeTotal];
  return (
    <>
      <Card className="gap-4">
        <CardHeader>
          <div className="flex items-center gap-3">
            <UserAvatar name={s.member.name} src={s.member.avatarUrl} />
            <div className="min-w-0 flex-1">
              <p className="text-sm text-muted-foreground">
                {s.member.isYou ? "Your" : `${s.member.name}'s`} bill for {monthLabel(s.month)}
              </p>
              <CardTitle className="text-3xl tracking-tight">
                <MoneyText value={t.closingBalance} variant="balance" />
              </CardTitle>
            </div>
            <Badge variant={s.isFinal ? "muted" : "info"}>{s.isFinal ? "Final" : "So far"}</Badge>
          </div>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm">
          {!isZero(t.openingBalance) && (
            <Row label="Carried from last month">
              <MoneyText value={t.openingBalance} variant="balance" />
            </Row>
          )}
          <Row label="You paid">
            + <MoneyText value={t.totalDeposit} />
          </Row>
          <Row label="Your costs">
            − <MoneyText value={sumStrings(costs)} />
          </Row>
          <div className="mt-1 border-t pt-2">
            <Row label={<span className="font-medium text-foreground">Balance</span>}>
              <MoneyText value={t.closingBalance} variant="balance" className="font-semibold" />
            </Row>
          </div>
          {s.settlement && Number(s.settlement.settledAmount) > 0 && (
            <p className="text-xs text-muted-foreground">
              {s.settlement.isSettled
                ? "Settled"
                : `${formatMoney(s.settlement.settledAmount)} settled so far`}
              :{" "}
              {s.settlement.payments
                .map((p) => `${formatMoney(p.amount)} on ${formatDate(p.paidAt, "d MMM")}`)
                .join(", ")}
            </p>
          )}
          {!s.isFinal && (
            <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
              <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
              An estimate until the month is closed: the meal rate changes as bazar and meals are added.
            </p>
          )}
        </CardContent>
      </Card>

      <Section title="Meals" total={t.mealCost}>
        {s.meals.length === 0 ? (
          <Empty>No meals this month.</Empty>
        ) : (
          <>
            {s.meals.map((m) => (
              <Row key={m.slot} label={`${m.slot}: ${formatCount(m.meals)} × ${formatCount(m.weight)}`}>
                {formatCount(m.weightedMeals)} meals
              </Row>
            ))}
            <Row
              label={
                <span className="text-foreground">
                  {formatCount(t.weightedMeals)} meals × {formatMoney(s.mealRate)} meal rate
                </span>
              }
            >
              <MoneyText value={t.mealCost} className="font-medium" />
            </Row>
          </>
        )}
      </Section>

      <Section title="Shared costs" total={t.sharedCost}>
        {s.expenses.length === 0 && !s.bazarShare ? (
          <Empty>No shared costs.</Empty>
        ) : (
          <>
            {s.expenses.map((e) => (
              <Row
                key={e.id}
                label={
                  <>
                    {e.title}{" "}
                    <span className="text-xs">
                      ({CATEGORY_LABELS[e.category as ExpenseCategory] ?? e.category}, {formatMoney(e.amount)}{" "}
                      total)
                    </span>
                  </>
                }
              >
                <MoneyText value={e.share} />
              </Row>
            ))}
            {s.bazarShare && (
              <Row label="Bazar shared equally (no meals were recorded)">
                <MoneyText value={s.bazarShare} />
              </Row>
            )}
          </>
        )}
      </Section>

      <Section title="Charges" total={t.chargeTotal}>
        {s.charges.length === 0 ? (
          <Empty>No charges.</Empty>
        ) : (
          s.charges.map((c) => (
            <Row
              key={c.id}
              label={
                <>
                  {CHARGE_LABELS[c.type as ChargeType] ?? c.type}
                  {c.description && ` · ${c.description}`}
                  {c.isEstimate && <span className="text-xs"> (estimate)</span>}
                </>
              }
            >
              <span className={cn(isNegative(c.amount) && "text-success")}>
                {isNegative(c.amount) ? `−${formatMoney(c.amount)}` : formatMoney(c.amount)}
              </span>
            </Row>
          ))
        )}
      </Section>

      <Section title="What you paid" total={t.totalDeposit}>
        {s.deposits.length === 0 && s.paidYourself.length === 0 ? (
          <Empty>Nothing paid this month.</Empty>
        ) : (
          <>
            {s.deposits.map((d) => (
              <Row key={d.id} label={`Deposit by ${methodLabel(d.method)}, ${formatDate(d.date, "d MMM")}`}>
                <MoneyText value={d.amount} />
              </Row>
            ))}
            {s.paidYourself.map((p) => (
              <Row
                key={p.id}
                label={`${p.kind === "BAZAR" ? "Bazar you paid for" : p.title}, ${formatDate(p.date, "d MMM")}`}
              >
                <MoneyText value={p.amount} />
              </Row>
            ))}
          </>
        )}
      </Section>
    </>
  );
}

const sumStrings = (values: string[]) => values.reduce((a, b) => (Number(a) + Number(b)).toFixed(2), "0");

function Section({ title, total, children }: { title: string; total: string; children: ReactNode }) {
  return (
    <Card className="gap-3">
      <CardHeader className="flex flex-row items-baseline justify-between">
        <CardTitle className="text-base">{title}</CardTitle>
        <MoneyText value={total} className="font-semibold" />
      </CardHeader>
      <CardContent className="grid gap-2 text-sm">{children}</CardContent>
    </Card>
  );
}

function Row({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="tabular shrink-0 text-right">{children}</span>
    </div>
  );
}

const Empty = ({ children }: { children: ReactNode }) => <p className="text-muted-foreground">{children}</p>;
