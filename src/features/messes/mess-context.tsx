"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Mess } from "./messes-types";

const CurrentMessContext = createContext<Mess | null>(null);

export function CurrentMessProvider({ mess, children }: { mess: Mess; children: ReactNode }) {
  return <CurrentMessContext.Provider value={mess}>{children}</CurrentMessContext.Provider>;
}

/** The mess of the current `/m/[slug]` page. Only usable inside mess-scoped pages. */
export function useCurrentMess() {
  const mess = useContext(CurrentMessContext);
  if (!mess) throw new Error("useCurrentMess must be used inside a mess page");
  return mess;
}

/**
 * What the current user may do in the current mess (BUSINESS_RULES §2). The UI uses this to hide
 * or disable actions; the API enforces the same rules.
 */
export function useMessPermissions() {
  const { membership } = useCurrentMess();
  const isAdmin = membership.role === "ADMIN";
  const canManage = isAdmin || membership.role === "MANAGER" || membership.isMonthManager;
  return { isAdmin, canManage, role: membership.role };
}
