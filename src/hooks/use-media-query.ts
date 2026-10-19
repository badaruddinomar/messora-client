"use client";

import { useSyncExternalStore } from "react";

/**
 * Subscribes to a CSS media query. Returns `false` during server rendering, so render the mobile
 * layout first and enhance (mobile-first, DESIGN_SYSTEM §1).
 */
export function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/** Tailwind's `lg` breakpoint, where the sidebar appears. */
export const useIsDesktop = () => useMediaQuery("(min-width: 1024px)");
/** Tailwind's `md` breakpoint, where dialogs replace bottom sheets and tables replace cards. */
export const useIsTabletUp = () => useMediaQuery("(min-width: 768px)");
