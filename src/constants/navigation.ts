import {
  CalendarCheck,
  CalendarRange,
  House,
  LayoutGrid,
  Megaphone,
  MessageCircle,
  ReceiptText,
  Settings,
  ShoppingBasket,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { messRoutes, ROUTES } from "./routes";

export interface NavItem {
  label: string;
  icon: LucideIcon;
  /** No href = the feature hasn't shipped yet; the item renders as "Soon". */
  href?: string;
  /** Shown in the mobile bottom bar (max 4 + "More"). */
  mobile?: boolean;
  /** Only match the exact path (for an overview page whose children are other items). */
  exact?: boolean;
}

export interface NavSection {
  label?: string;
  items: NavItem[];
}

/**
 * Single source for the sidebar, the bottom bar and the "More" sheet.
 * Mess pages get mess-scoped links; elsewhere only the messes hub is available.
 * Fill in hrefs as phases ship.
 */
export function buildNavigation(slug: string | null): NavSection[] {
  if (!slug) {
    return [{ items: [{ label: "My messes", icon: LayoutGrid, href: ROUTES.messes, mobile: true }] }];
  }
  const routes = messRoutes(slug);
  return [
    {
      items: [
        { label: "Overview", icon: House, href: routes.overview, mobile: true, exact: true },
        { label: "Meals", icon: CalendarCheck, href: routes.meals, mobile: true },
        { label: "Bazar", icon: ShoppingBasket, href: routes.bazar, mobile: true },
        { label: "Deposits", icon: Wallet },
        { label: "Expenses", icon: ReceiptText },
        { label: "Months", icon: CalendarRange, href: routes.months },
      ],
    },
    {
      label: "Mess",
      items: [
        { label: "Members", icon: Users, href: routes.members },
        { label: "Chat", icon: MessageCircle, mobile: true },
        { label: "Notices", icon: Megaphone },
        { label: "Settings", icon: Settings, href: routes.settings },
      ],
    },
  ];
}
