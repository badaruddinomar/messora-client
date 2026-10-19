import { Building2 } from "lucide-react";

/** Square tile with the mess's initial, used wherever a mess is listed. */
export function MessTile({ name, small = false }: { name?: string; small?: boolean }) {
  return (
    <span
      aria-hidden
      className={
        small
          ? "flex size-6 shrink-0 items-center justify-center rounded-md bg-accent text-[11px] font-semibold text-accent-foreground"
          : "flex size-8 shrink-0 items-center justify-center rounded-md bg-accent text-sm font-semibold text-accent-foreground"
      }
    >
      {name ? name.trim()[0]?.toUpperCase() : <Building2 className={small ? "size-3.5" : "size-4"} />}
    </span>
  );
}
