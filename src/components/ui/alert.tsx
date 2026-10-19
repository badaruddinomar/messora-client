import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Alert({ tone = "error", children }: { tone?: "error" | "success" | "info"; children: ReactNode }) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "rounded-lg border px-3 py-2 text-sm",
        tone === "error" && "border-danger/30 bg-danger/10 text-danger",
        tone === "success" && "border-primary/30 bg-primary/10 text-primary",
        tone === "info" && "border-border bg-card text-muted",
      )}
    >
      {children}
    </div>
  );
}
