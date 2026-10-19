"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import type { NavItem } from "@/constants/navigation";
import { cn } from "@/lib/cn";

export const isActivePath = (pathname: string, href?: string) =>
  !!href && (pathname === href || pathname.startsWith(`${href}/`));

/** A sidebar / "More" sheet row. */
export function NavLink({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
  const pathname = usePathname();
  const active = isActivePath(pathname, item.href);
  const Icon = item.icon;

  const classes = cn(
    "group flex h-9 items-center gap-3 rounded-md px-2.5 text-sm font-medium transition-colors duration-150",
    active
      ? "bg-sidebar-accent text-sidebar-accent-foreground"
      : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
  );

  if (!item.href) {
    return (
      <span
        className={cn(classes, "cursor-default opacity-60 hover:bg-transparent hover:text-muted-foreground")}
        aria-disabled
      >
        <Icon className="size-4 shrink-0" aria-hidden />
        <span className="flex-1 truncate">{item.label}</span>
        <Badge variant="muted" className="px-1.5 text-[10px]">
          Soon
        </Badge>
      </span>
    );
  }

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={classes}
    >
      <Icon className={cn("size-4 shrink-0", active && "text-primary")} aria-hidden />
      <span className="truncate">{item.label}</span>
    </Link>
  );
}
