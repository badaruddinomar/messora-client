"use client";

import { CloudOff, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getErrorMessage, type RequestError } from "@/lib/api-error";
import { cn } from "@/lib/cn";

interface ErrorStateProps {
  error?: RequestError;
  title?: string;
  /** Usually RTK Query's `refetch`. */
  onRetry?: () => void;
  retrying?: boolean;
  className?: string;
}

/** Shown in place of content that failed to load (DESIGN_SYSTEM §7). */
export function ErrorState({
  error,
  title = "Couldn't load this",
  onRetry,
  retrying,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border bg-card px-6 py-12 text-center",
        className,
      )}
    >
      <span className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <CloudOff className="size-5" aria-hidden />
      </span>
      <h2 className="mt-4 font-medium">{title}</h2>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{getErrorMessage(error)}</p>
      {onRetry && (
        <Button variant="outline" className="mt-6" onClick={onRetry} loading={retrying}>
          {!retrying && <RotateCw />}
          Try again
        </Button>
      )}
    </div>
  );
}
