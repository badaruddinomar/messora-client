"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { ChevronLeft, FileText, Lock } from "lucide-react";
import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { messRoutes } from "@/constants/routes";
import { useCurrentMess, useMessPermissions } from "@/features/messes/mess-context";
import { useMonthsQuery } from "../months-api";
import type { Month } from "../months-types";
import { formatPeriod, monthLabel } from "../utils";
import { CloseMonthDialog } from "./close-month-dialog";
import { HandoverPanel } from "./handover-panel";
import { MonthStatusBadge } from "./month-status-badge";
import { MonthSummary } from "./month-summary";
import { SettleUp } from "./settle-up";

const TABS = ["bill", "settle"] as const;

/** One month: its bill (live or final), closing it, and afterwards settling up and handing over cash. */
export function MonthDetailPage() {
  const { monthId } = useParams<{ monthId: string }>();
  const mess = useCurrentMess();
  const { data: months, isLoading } = useMonthsQuery(mess.id);
  const month = months?.find((m) => m.id === monthId);

  if (isLoading) return <Skeleton className="h-96 rounded-xl" />;
  if (!month) {
    return <EmptyState icon={FileText} title="Month not found" action={<BackLink />} />;
  }
  return <MonthDetail month={month} />;
}

function BackLink() {
  const mess = useCurrentMess();
  return (
    <Button variant="ghost" size="sm" className="-ml-2 w-fit" asChild>
      <Link href={messRoutes(mess.slug).months}>
        <ChevronLeft />
        All months
      </Link>
    </Button>
  );
}

function MonthDetail({ month }: { month: Month }) {
  const mess = useCurrentMess();
  const { canManage } = useMessPermissions();
  const [tab, setTab] = useQueryState("tab", parseAsStringLiteral(TABS).withDefault("bill"));
  const closed = month.status === "CLOSED";
  const canClose = canManage && (month.status === "CLOSING" || (month.status === "OPEN" && month.hasEnded));

  return (
    <div className="grid gap-6">
      <BackLink />
      <PageHeader
        title={
          <span className="flex flex-wrap items-center gap-3">
            {monthLabel(month)}
            <MonthStatusBadge month={month} />
          </span>
        }
        description={formatPeriod(month)}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link href={messRoutes(mess.slug).bill(month.id)}>
                <FileText />
                My bill
              </Link>
            </Button>
            {/* Stays mounted once the month closes, so the wizard can show its "closed" step. */}
            {(canClose || (canManage && closed)) && (
              <CloseMonthDialog
                month={month}
                trigger={(open) =>
                  canClose && (
                    <Button onClick={open}>
                      <Lock />
                      {month.status === "CLOSING" ? "Finish closing" : "Close month"}
                    </Button>
                  )
                }
              />
            )}
          </div>
        }
      />

      {closed ? (
        <>
          <Tabs value={tab} onValueChange={(v) => setTab(v === "bill" ? null : (v as (typeof TABS)[number]))}>
            <TabsList>
              <TabsTrigger value="bill">Bill</TabsTrigger>
              <TabsTrigger value="settle">Settle up</TabsTrigger>
            </TabsList>
          </Tabs>
          {tab === "bill" ? (
            <MonthSummary month={month} />
          ) : (
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
              <SettleUp month={month} />
              <HandoverPanel month={month} />
            </div>
          )}
        </>
      ) : (
        <MonthSummary month={month} />
      )}
    </div>
  );
}
