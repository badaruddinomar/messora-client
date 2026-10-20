"use client";

import { Logo } from "@/components/common/logo";
import { buildNavigation } from "@/constants/navigation";
import { ROUTES } from "@/constants/routes";
import { useMessFromRoute } from "@/features/messes/hooks/use-mess-from-route";
import { MessSwitcher } from "./mess-switcher";
import { NavLink } from "./nav-link";

/** Desktop sidebar (lg and up). */
export function Sidebar() {
  const { slug } = useMessFromRoute();

  return (
    <aside className="sticky top-0 hidden h-svh w-64 shrink-0 flex-col border-r bg-sidebar lg:flex print:hidden">
      <div className="flex h-16 items-center px-5">
        <Logo href={ROUTES.dashboard} />
      </div>
      <div className="px-3 pb-3">
        <MessSwitcher />
      </div>
      <nav aria-label="Main" className="flex-1 space-y-6 overflow-y-auto px-3 py-2">
        {buildNavigation(slug).map((section, i) => (
          <div key={section.label ?? i} className="space-y-1">
            {section.label && (
              <p className="px-2.5 pb-1 text-xs font-medium tracking-wide text-muted-foreground/80 uppercase">
                {section.label}
              </p>
            )}
            {section.items.map((item) => (
              <NavLink key={item.label} item={item} />
            ))}
          </div>
        ))}
      </nav>
    </aside>
  );
}
