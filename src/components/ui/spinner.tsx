import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/cn";

/** Inline spinner, for buttons only. Content loading uses skeletons (DESIGN_SYSTEM §7). */
export function Spinner({ className }: { className?: string }) {
  return <LoaderCircle aria-hidden className={cn("size-4 animate-spin", className)} />;
}

/** Full-screen loader for the moment before the session is known. */
export function FullPageSpinner() {
  return (
    <div className="flex min-h-svh items-center justify-center" role="status" aria-label="Loading">
      <Spinner className="size-6 text-primary" />
    </div>
  );
}
