import { BottomNav } from "@/components/layout/bottom-nav";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { RequireAuth } from "@/features/auth/components/require-auth";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <RequireAuth>
      <div className="flex min-h-svh">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar />
          {/* Bottom padding keeps content clear of the mobile bottom nav. */}
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-6 pb-24 sm:px-6 lg:pt-8 lg:pb-10 print:max-w-none print:p-0">
            {children}
          </main>
        </div>
      </div>
      <BottomNav />
    </RequireAuth>
  );
}
