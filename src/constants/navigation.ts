import {
  Bell,
  CalendarCheck,
  ChartPie,
  House,
  Megaphone,
  MessageCircle,
  ReceiptText,
  Settings,
  ShoppingBasket,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { ROUTES } from "./routes";

export interface NavItem {
  label: string;
  icon: LucideIcon;
  /** No href = the feature hasn't shipped yet; the item renders as "Soon". */
  href?: string;
  /** Shown in the mobile bottom bar (max 4 + "More"). */
  mobile?: boolean;
}

export interface NavSection {
  label?: string;
  items: NavItem[];
}

/** Single source for the sidebar, the bottom bar and the "More" sheet. Fill in hrefs as phases ship. */
export const NAVIGATION: NavSection[] = [
  {
    items: [
      { label: "Home", icon: House, href: ROUTES.dashboard, mobile: true },
      { label: "Meals", icon: CalendarCheck, mobile: true },
      { label: "Bazar", icon: ShoppingBasket, mobile: true },
      { label: "Deposits", icon: Wallet },
      { label: "Expenses", icon: ReceiptText },
    ],
  },
  {
    label: "Mess",
    items: [
      { label: "Month summary", icon: ChartPie },
      { label: "Members", icon: Users },
      { label: "Chat", icon: MessageCircle, mobile: true },
      { label: "Notices", icon: Megaphone },
      { label: "Notifications", icon: Bell },
      { label: "Settings", icon: Settings },
    ],
  },
];

export const MOBILE_NAV_ITEMS = NAVIGATION.flatMap((s) => s.items).filter((i) => i.mobile);
