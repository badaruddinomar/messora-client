import { Building2 } from "lucide-react";

/**
 * Placeholder until Phase 2 adds messes: then this becomes a dropdown of the user's messes,
 * with "Create a mess" and "Join with a code" at the bottom.
 */
export function MessSwitcher() {
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card px-3 py-2.5">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
        <Building2 className="size-4" aria-hidden />
      </span>
      <div className="min-w-0 text-sm">
        <p className="truncate font-medium">No mess yet</p>
        <p className="truncate text-xs text-muted-foreground">Create or join one</p>
      </div>
    </div>
  );
}
