import Link from "next/link";
import { cn } from "@/lib/cn";

/** Brand mark: a rounded tile with a stylised plate + the wordmark. */
export function Logo({
  href = "/",
  className,
  showText = true,
}: {
  href?: string;
  className?: string;
  showText?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-2 rounded-md focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:outline-none",
        className,
      )}
    >
      <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
        <svg viewBox="0 0 24 24" fill="none" aria-hidden className="size-5">
          <circle cx="12" cy="12" r="7.25" stroke="currentColor" strokeWidth="1.75" />
          <circle cx="12" cy="12" r="3.25" fill="currentColor" opacity="0.9" />
        </svg>
      </span>
      {showText && <span className="text-lg font-semibold tracking-tight">Messora</span>}
    </Link>
  );
}
