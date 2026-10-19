"use client";

import { parseAsString, useQueryState } from "nuqs";
import { useCurrentMess } from "@/features/messes/mess-context";
import { useMonthsQuery } from "../months-api";
import type { Month } from "../months-types";
import { monthKey } from "../utils";

/**
 * The billing month a page is showing, kept in the URL as `?month=2026-10` so it survives a
 * refresh and can be shared. Defaults to the current month. Components using it need a Suspense
 * boundary (nuqs reads the URL).
 */
export function useSelectedMonth() {
  const mess = useCurrentMess();
  const query = useMonthsQuery(mess.id);
  const [key, setKey] = useQueryState("month", parseAsString);

  const months = query.data ?? [];
  const current = months.find((m) => m.isCurrent) ?? months[0];
  const selected: Month | undefined = (key && months.find((m) => monthKey(m) === key)) || current;

  const select = (month: Month) => setKey(month.isCurrent ? null : monthKey(month));

  return { ...query, months, current, selected, select };
}
