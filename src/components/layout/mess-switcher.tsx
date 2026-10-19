"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronsUpDown, KeyRound, LayoutGrid, Plus } from "lucide-react";
import { MessTile } from "@/components/common/mess-tile";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { messRoutes, ROUTES } from "@/constants/routes";
import { useMessFromRoute } from "@/features/messes/hooks/use-mess-from-route";
import { useMyMessesQuery } from "@/features/messes/messes-api";
import { ROLE_LABELS } from "@/features/messes/utils";

/** Shows the current mess and switches between the user's messes. */
export function MessSwitcher() {
  const router = useRouter();
  const { data: messes, isLoading } = useMyMessesQuery();
  const { mess: current } = useMessFromRoute();

  if (isLoading) return <Skeleton className="h-14 w-full rounded-lg" />;

  const active = messes?.filter((m) => m.membership.status === "ACTIVE") ?? [];
  const pending = messes?.filter((m) => m.membership.status === "PENDING") ?? [];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex w-full items-center gap-3 rounded-lg border bg-card px-3 py-2.5 text-left shadow-xs transition-colors hover:bg-accent/50 focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:outline-none data-[state=open]:bg-accent/50">
        <MessTile name={current?.name} />
        <div className="min-w-0 flex-1 text-sm">
          <p className="truncate font-medium">
            {current?.name ?? (active.length ? "Choose a mess" : "No mess yet")}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {current
              ? ROLE_LABELS[current.membership.role]
              : active.length
                ? `${active.length} messes`
                : "Create or join one"}
          </p>
        </div>
        <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-(--radix-dropdown-menu-trigger-width) min-w-60">
        {active.length > 0 && (
          <>
            <DropdownMenuLabel>Your messes</DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={current?.slug ?? ""}
              onValueChange={(slug) => router.push(messRoutes(slug).overview)}
            >
              {active.map((m) => (
                <DropdownMenuRadioItem key={m.id} value={m.slug}>
                  <MessTile name={m.name} small />
                  <span className="truncate">{m.name}</span>
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </>
        )}
        {pending.length > 0 && (
          <>
            <DropdownMenuLabel>Waiting for approval</DropdownMenuLabel>
            {pending.map((m) => (
              <DropdownMenuItem key={m.id} asChild>
                <Link href={ROUTES.messes}>
                  <MessTile name={m.name} small />
                  <span className="flex-1 truncate">{m.name}</span>
                  <Badge variant="warning">Pending</Badge>
                </Link>
              </DropdownMenuItem>
            ))}
          </>
        )}
        {(active.length > 0 || pending.length > 0) && <DropdownMenuSeparator />}
        <DropdownMenuItem asChild>
          <Link href={ROUTES.messes}>
            <LayoutGrid />
            All messes
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={ROUTES.newMess}>
            <Plus />
            Create a mess
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={ROUTES.join}>
            <KeyRound />
            Join with a code
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
