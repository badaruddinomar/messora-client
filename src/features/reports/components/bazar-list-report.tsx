"use client";

import { ShoppingBasket } from "lucide-react";
import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useBazarsInfiniteQuery } from "@/features/bazars/bazars-api";
import { PAID_FROM_LABELS } from "@/features/bazars/components/bazar-detail-dialog";
import { useCurrentMess } from "@/features/messes/mess-context";
import type { Month } from "@/features/months/months-types";
import { formatDate, formatMoney } from "@/lib/format";
import { sumMoney } from "@/lib/money";

/** The month's approved bazar, oldest first, as a printable list. */
export function BazarListReport({ month }: { month: Month }) {
  const mess = useCurrentMess();
  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } = useBazarsInfiniteQuery({
    messId: mess.id,
    monthId: month.id,
    status: "APPROVED",
    limit: 100,
  });
  const bazars = [...(data?.pages.flatMap((p) => p.items) ?? [])].sort((a, b) =>
    a.date.localeCompare(b.date),
  );

  return (
    <Card className="break-before-page">
      <CardHeader>
        <CardTitle>Bazar list</CardTitle>
        <CardDescription>
          Every approved bazar this month, with who shopped and what they bought.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-40" />
        ) : bazars.length === 0 ? (
          <EmptyState
            icon={ShoppingBasket}
            title="No bazar yet"
            description="Approved bazar shows up here."
            className="border-0 py-6"
          />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Shopper</TableHead>
                  <TableHead className="hidden sm:table-cell print:table-cell">Items</TableHead>
                  <TableHead>Paid from</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bazars.map((b) => (
                  <TableRow key={b.id} className="break-inside-avoid">
                    <TableCell className="whitespace-nowrap">{formatDate(b.date, "d MMM")}</TableCell>
                    <TableCell>{b.shopper.name}</TableCell>
                    <TableCell className="hidden max-w-xs text-muted-foreground sm:table-cell print:table-cell">
                      {b.items.length > 0 ? b.items.map((i) => i.name).join(", ") : (b.note ?? "–")}
                    </TableCell>
                    <TableCell>{PAID_FROM_LABELS[b.paidFrom]}</TableCell>
                    <TableCell className="tabular text-right">{formatMoney(b.totalAmount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={2} className="font-medium">
                    {hasNextPage ? "Total of the bazars shown" : "Total"}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell print:table-cell" />
                  <TableCell />
                  <TableCell className="tabular text-right font-semibold">
                    {formatMoney(sumMoney(bazars.map((b) => b.totalAmount)))}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
            {hasNextPage && (
              <div className="mt-3 flex justify-center print:hidden">
                <Button variant="outline" onClick={() => fetchNextPage()} loading={isFetchingNextPage}>
                  Load more
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
