"use client";

import { useState, type ReactNode } from "react";
import { Provider } from "react-redux";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { ThemeProvider } from "next-themes";
import { MotionConfig } from "motion/react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { makeStore } from "@/store";

export function Providers({ children }: { children: ReactNode }) {
  const [store] = useState(makeStore);

  return (
    <Provider store={store}>
      <NuqsAdapter>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {/* "user" turns motion animations off when the OS asks for reduced motion. */}
          <MotionConfig reducedMotion="user">
            <TooltipProvider>
              {children}
              <Toaster />
            </TooltipProvider>
          </MotionConfig>
        </ThemeProvider>
      </NuqsAdapter>
    </Provider>
  );
}
