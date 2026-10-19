"use client";

import { useState, type ReactNode } from "react";
import { Provider } from "react-redux";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { makeStore } from "@/store";

export function Providers({ children }: { children: ReactNode }) {
  const [store] = useState(makeStore);

  return (
    <Provider store={store}>
      <NuqsAdapter>{children}</NuqsAdapter>
    </Provider>
  );
}
