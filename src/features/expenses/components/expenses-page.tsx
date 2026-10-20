"use client";

import { parseAsStringLiteral, useQueryState } from "nuqs";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMessPermissions } from "@/features/messes/mess-context";
import { MonthPicker } from "@/features/months/components/month-picker";
import { MonthReadOnlyBanner } from "@/features/months/components/month-read-only-banner";
import { useSelectedMonth } from "@/features/months/hooks/use-selected-month";
import { isMonthEditable } from "@/features/months/utils";
import { ChargesTab } from "./charges-tab";
import { ExpenseFormDialog } from "./expense-form-dialog";
import { ExpensesTab } from "./expense-list";
import { StaffTab } from "./staff-tab";

const TABS = ["shared", "charges", "staff"] as const;
type Tab = (typeof TABS)[number];

/** Everything besides bazar that goes on the bill: shared costs, personal charges and staff salaries. */
export function ExpensesPage() {
  const { canManage } = useMessPermissions();
  const { selected: month } = useSelectedMonth();
  const [tab, setTab] = useQueryState("tab", parseAsStringLiteral(TABS).withDefault("shared"));
  const editable = !!month && isMonthEditable(month);

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Expenses"
        description="Bills, rent and salaries shared by the mess, and charges for one member."
        actions={
          canManage &&
          editable && (
            <ExpenseFormDialog
              trigger={(open) => (
                <Button onClick={open}>
                  <Plus />
                  Add expense
                </Button>
              )}
            />
          )
        }
      />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={tab} onValueChange={(v) => setTab(v === "shared" ? null : (v as Tab))}>
          <TabsList className="w-full sm:w-fit">
            <TabsTrigger value="shared">Shared costs</TabsTrigger>
            <TabsTrigger value="charges">Charges</TabsTrigger>
            <TabsTrigger value="staff">Staff</TabsTrigger>
          </TabsList>
        </Tabs>
        <MonthPicker />
      </div>
      {month && <MonthReadOnlyBanner month={month} />}
      {tab === "shared" && <ExpensesTab monthId={month?.id} />}
      {tab === "charges" && <ChargesTab month={month} />}
      {tab === "staff" && <StaffTab month={month} />}
    </div>
  );
}
