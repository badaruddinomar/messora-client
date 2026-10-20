"use client";

import { format } from "date-fns";
import { ChevronDown, Download, Printer } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentMess } from "@/features/messes/mess-context";
import { MonthPicker } from "@/features/months/components/month-picker";
import { MonthSummary } from "@/features/months/components/month-summary";
import { useSelectedMonth } from "@/features/months/hooks/use-selected-month";
import type { Month } from "@/features/months/months-types";
import { monthKey, monthLabel } from "@/features/months/utils";
import { downloadFile } from "@/lib/download";
import { exportUrl, statementExportUrl, useMonthReportQuery } from "../reports-api";
import { BazarDayChart } from "./bazar-day-chart";
import { BazarListReport } from "./bazar-list-report";
import { CategoryChart } from "./category-chart";
import { MealRateChart } from "./meal-rate-chart";

/**
 * Charts and printable reports for one month (`?month=`): totals, where the money went, everyone's
 * bill and the bazar list. "Print" gives a clean, paper-ready page (or a PDF via the print dialog).
 */
export function ReportsPage() {
  const mess = useCurrentMess();
  const { selected } = useSelectedMonth();

  return (
    // minmax(0, 1fr): wide tables scroll inside their card instead of widening the page (and the charts).
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <PageHeader
        className="print:hidden"
        title="Reports"
        description="Where the money went, month by month. Print any month or download it as CSV."
        actions={selected && <ReportActions month={selected} />}
      />
      <div className="print:hidden">
        <MonthPicker />
      </div>
      {selected ? (
        <MonthReportBody key={selected.id} month={selected} />
      ) : (
        <Skeleton className="h-96 rounded-xl" />
      )}
      <p className="hidden text-xs text-muted-foreground print:block">
        {mess.name} · printed {format(new Date(), "d MMM yyyy, h:mm a")} from Messora
      </p>
    </div>
  );
}

function ReportActions({ month }: { month: Month }) {
  const mess = useCurrentMess();
  const file = (what: string) => `${mess.slug}-${monthKey(month)}-${what}.csv`;
  const download = (url: string, name: string) =>
    downloadFile(url, name).catch((e: unknown) =>
      toast.error(e instanceof Error ? e.message : "Couldn't download the file"),
    );

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">
            <Download />
            CSV
            <ChevronDown />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onSelect={() => download(exportUrl(mess.id, month.id, "summary"), file("summary"))}
          >
            Everyone&apos;s bill
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => download(exportUrl(mess.id, month.id, "bazars"), file("bazar"))}>
            Bazar list
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => download(statementExportUrl(mess.id, month.id), file("my-bill"))}>
            My bill
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Button onClick={() => window.print()}>
        <Printer />
        Print or PDF
      </Button>
    </>
  );
}

function MonthReportBody({ month }: { month: Month }) {
  const mess = useCurrentMess();
  const { data: report, isFetching } = useMonthReportQuery({ messId: mess.id, monthId: month.id });
  const final = month.status === "CLOSED";

  return (
    <>
      <header className="hidden print:block">
        <p className="text-sm text-muted-foreground">Monthly report</p>
        <h1 className="text-2xl font-semibold">{mess.name}</h1>
        <p className="text-sm text-muted-foreground">
          {monthLabel(month)}:{" "}
          {final ? "final, these numbers won't change." : "an estimate until the month is closed."}
        </p>
      </header>

      <MonthSummary month={month} />

      <MealRateChart />
      <div className="grid gap-4 lg:grid-cols-2 lg:items-start print:grid-cols-1">
        <CategoryChart report={report} isFetching={isFetching} />
        <BazarDayChart report={report} isFetching={isFetching} />
      </div>
      <BazarListReport month={month} />
    </>
  );
}
