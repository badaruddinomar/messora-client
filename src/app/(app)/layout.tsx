import { AppHeader } from "@/components/layout/app-header";
import { RequireAuth } from "@/features/auth/components/require-auth";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <RequireAuth>
      <AppHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
    </RequireAuth>
  );
}
