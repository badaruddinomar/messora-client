"use client";

import { parseAsString, parseAsStringLiteral, useQueryStates } from "nuqs";

const STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const;
const PAID_FROM = ["MESS_FUND", "OWN_POCKET"] as const;

/** Bazar list filters, kept in the URL (`?status=PENDING&shopper=…&paid=OWN_POCKET`) so they survive a refresh. */
export function useBazarFilters() {
  const [filters, setFilters] = useQueryStates({
    status: parseAsStringLiteral(STATUSES),
    shopper: parseAsString,
    paid: parseAsStringLiteral(PAID_FROM),
  });
  const active = Object.values(filters).filter(Boolean).length;
  const clear = () => setFilters({ status: null, shopper: null, paid: null });
  return { filters, setFilters, active, clear };
}
