"use client";

import { parseAsStringLiteral, useQueryState } from "nuqs";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCurrentMess, useMessPermissions } from "@/features/messes/mess-context";
import { MonthReadOnlyBanner } from "@/features/months/components/month-read-only-banner";
import { useSelectedMonth } from "@/features/months/hooks/use-selected-month";
import { useBazarSummaryQuery } from "../bazars-api";
import { BazarFormDialog } from "./bazar-form-dialog";
import { BazarList } from "./bazar-list";
import { BazarSummaryCards, ShoppersCard } from "./bazar-summary";
import { DutyBoard } from "./duty-board";
import { ReviewQueue } from "./review-queue";

const TABS = ["list", "review", "duty"] as const;
type Tab = (typeof TABS)[number];

/** Bazar: what was bought this month, what needs approval, and whose turn it is to shop. */
export function BazarsPage() {
  const mess = useCurrentMess();
  const { canManage } = useMessPermissions();
  const { selected: month, current } = useSelectedMonth();
  const [tab, setTab] = useQueryState("tab", parseAsStringLiteral(TABS).withDefault("list"));
  const { data: currentSummary } = useBazarSummaryQuery(
    { messId: mess.id, monthId: current?.id },
    { skip: !canManage || !current },
  );
  const pending = currentSummary?.pending.count ?? 0;

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Bazar"
        description="Groceries bought for the mess. Approved bazar sets the meal rate."
        actions={
          <BazarFormDialog
            trigger={(open) => (
              <Button onClick={open}>
                <Plus />
                Add bazar
              </Button>
            )}
          />
        }
      />

      <Tabs value={tab} onValueChange={(v) => setTab(v === "list" ? null : (v as Tab))}>
        <TabsList className="w-full sm:w-fit">
          <TabsTrigger value="list">Bazars</TabsTrigger>
          {canManage && (
            <TabsTrigger value="review">
              To review
              {pending > 0 && (
                <Badge variant="warning" className="tabular ml-1 px-1.5">
                  {pending}
                </Badge>
              )}
            </TabsTrigger>
          )}
          <TabsTrigger value="duty">Duty</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="grid gap-4">
          {month && <MonthReadOnlyBanner month={month} />}
          <BazarSummaryCards monthId={month?.id} />
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
            <BazarList month={month} />
            <ShoppersCard monthId={month?.id} />
          </div>
        </TabsContent>
        {canManage && (
          <TabsContent value="review">
            <ReviewQueue />
          </TabsContent>
        )}
        <TabsContent value="duty">
          <DutyBoard month={month} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
