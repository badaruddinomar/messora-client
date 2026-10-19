import { Logo } from "@/components/common/logo";
import { ROUTES } from "@/constants/routes";
import { NotificationBell } from "./notification-bell";
import { UserMenu } from "./user-menu";

export function TopBar() {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur-md supports-backdrop-filter:bg-background/70 sm:px-6">
      <Logo href={ROUTES.dashboard} className="lg:hidden" />
      <div className="ml-auto flex items-center gap-1.5">
        <NotificationBell />
        <UserMenu />
      </div>
    </header>
  );
}
