import Link from "next/link";
import { Suspense } from "react";
import { FullPageSpinner } from "@/components/ui/spinner";
import { RequireGuest } from "@/features/auth/components/require-guest";
import { ROUTES } from "@/constants/routes";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <Suspense fallback={<FullPageSpinner />}>
      <RequireGuest>
        <main className="flex flex-1 flex-col items-center justify-center px-4 py-12">
          <Link href={ROUTES.home} className="mb-8 text-2xl font-bold tracking-tight">
            Mess<span className="text-primary">ora</span>
          </Link>
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-sm">{children}</div>
        </main>
      </RequireGuest>
    </Suspense>
  );
}
