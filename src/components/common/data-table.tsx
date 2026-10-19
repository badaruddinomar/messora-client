"use client";

import { useState, type ReactNode } from "react";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type OnChangeFn,
  type Row,
  type SortingState,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/cn";

interface DataTableProps<TData> {
  columns: ColumnDef<TData, unknown>[];
  data: TData[] | undefined;
  isLoading?: boolean;
  /** Shown when there are no rows. Use <EmptyState />. */
  empty: ReactNode;
  /** Mobile layout: how one row looks as a card (DESIGN_SYSTEM §5: tables become cards on phones). */
  renderCard: (row: Row<TData>) => ReactNode;
  getRowId?: (row: TData) => string;
  onRowClick?: (row: TData) => void;
  /**
   * Controlled sorting, so pages can keep it in the URL with nuqs.
   * Leave both unset for local sorting.
   */
  sorting?: SortingState;
  onSortingChange?: OnChangeFn<SortingState>;
  /** Number of skeleton rows while loading. */
  skeletonRows?: number;
}

export function DataTable<TData>({
  columns,
  data,
  isLoading,
  empty,
  renderCard,
  getRowId,
  onRowClick,
  sorting: controlledSorting,
  onSortingChange,
  skeletonRows = 5,
}: DataTableProps<TData>) {
  const [localSorting, setLocalSorting] = useState<SortingState>([]);
  const sorting = controlledSorting ?? localSorting;

  // TanStack Table returns new functions each render by design; the React Compiler lint rule
  // doesn't apply to it.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: data ?? [],
    columns,
    getRowId,
    state: { sorting },
    onSortingChange: onSortingChange ?? setLocalSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (isLoading) {
    return (
      <div className="overflow-hidden rounded-xl border bg-card" aria-busy>
        {Array.from({ length: skeletonRows }, (_, i) => (
          <div key={i} className="flex items-center gap-3 border-b px-4 py-3.5 last:border-0">
            <Skeleton className="size-8 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3.5 w-1/3" />
              <Skeleton className="h-3 w-1/5" />
            </div>
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    );
  }

  const rows = table.getRowModel().rows;
  if (rows.length === 0) return <>{empty}</>;

  return (
    <>
      {/* Phones: cards */}
      <ul className="grid gap-2 md:hidden">
        {rows.map((row) => (
          <li key={row.id}>
            {onRowClick ? (
              <button
                type="button"
                onClick={() => onRowClick(row.original)}
                className="w-full rounded-xl border bg-card p-4 text-left shadow-xs transition-colors active:bg-muted/60"
              >
                {renderCard(row)}
              </button>
            ) : (
              <div className="rounded-xl border bg-card p-4 shadow-xs">{renderCard(row)}</div>
            )}
          </li>
        ))}
      </ul>

      {/* Tablet and up: table */}
      <div className="hidden overflow-hidden rounded-xl border bg-card shadow-xs md:block">
        <Table>
          <TableHeader className="bg-muted/40">
            {table.getHeaderGroups().map((group) => (
              <TableRow key={group.id} className="hover:bg-transparent">
                {group.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const sorted = header.column.getIsSorted();
                  return (
                    <TableHead
                      key={header.id}
                      aria-sort={
                        sorted === "asc" ? "ascending" : sorted === "desc" ? "descending" : undefined
                      }
                      className={cn(header.column.columnDef.meta?.align === "right" && "text-right")}
                    >
                      {header.isPlaceholder ? null : canSort ? (
                        <button
                          type="button"
                          onClick={header.column.getToggleSortingHandler()}
                          className={cn(
                            "inline-flex items-center gap-1 rounded-sm hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:outline-none",
                            header.column.columnDef.meta?.align === "right" && "flex-row-reverse",
                          )}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {sorted === "asc" ? (
                            <ArrowUp className="size-3.5" />
                          ) : sorted === "desc" ? (
                            <ArrowDown className="size-3.5" />
                          ) : (
                            <ChevronsUpDown className="size-3.5 opacity-50" />
                          )}
                        </button>
                      ) : (
                        flexRender(header.column.columnDef.header, header.getContext())
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow
                key={row.id}
                onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                className={cn(onRowClick && "cursor-pointer")}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className={cn(cell.column.columnDef.meta?.align === "right" && "tabular text-right")}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
