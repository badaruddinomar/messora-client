"use client";

import { useEffect, useState } from "react";

/** `value`, but only after it has stopped changing for `delayMs` (for live previews while typing). */
export function useDebouncedValue<T>(value: T, delayMs = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}
