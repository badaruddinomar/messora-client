"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Ellipsis } from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { buildNavigation, type NavItem } from "@/constants/navigation";
import { useMessFromRoute } from "@/features/messes/hooks/use-mess-from-route";
import { cn } from "@/lib/cn";
import { MessSwitcher } from "./mess-switcher";
import { isActivePath, NavLink } from "./nav-link";

const itemClasses =
  "flex flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors duration-150";

/** Phone navigation: 4 main destinations + "More" (DESIGN_SYSTEM §5). */
export function BottomNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const { slug } = useMessFromRoute();
  const items = buildNavigation(slug).flatMap((s) => s.items);

  return (
    <>
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-30 flex h-16 border-t bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden print:hidden"
      >
        {items
          .filter((i) => i.mobile)
          .map((item) => (
            <BottomNavItem key={item.label} item={item} active={isActivePath(pathname, item)} />
          ))}
        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          className={cn(itemClasses, "text-muted-foreground")}
          aria-haspopup="dialog"
        >
          <span className="flex h-7 w-12 items-center justify-center rounded-full">
            <Ellipsis className="size-5" aria-hidden />
          </span>
          More
        </button>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="gap-5">
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <MessSwitcher />
          <div className="grid gap-1">
            {items
              .filter((i) => !i.mobile)
              .map((item) => (
                <NavLink key={item.label} item={item} onNavigate={() => setMoreOpen(false)} />
              ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

function BottomNavItem({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  const content = (
    <>
      <span
        className={cn(
          "flex h-7 w-12 items-center justify-center rounded-full transition-colors duration-150",
          active && "bg-accent",
        )}
      >
        <Icon className="size-5" aria-hidden />
      </span>
      {item.label}
    </>
  );

  if (!item.href) {
    return (
      <span
        className={cn(itemClasses, "text-muted-foreground/50")}
        aria-disabled
        title={`${item.label} is coming soon`}
      >
        {content}
      </span>
    );
  }
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(itemClasses, active ? "text-primary" : "text-muted-foreground hover:text-foreground")}
    >
      {content}
    </Link>
  );
}
