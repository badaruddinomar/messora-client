"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useLogoutMutation } from "@/features/auth/auth-api";
import { selectUser } from "@/features/auth/auth-slice";
import { useAppSelector } from "@/store/hooks";

export function AppHeader() {
  const user = useAppSelector(selectUser);
  const [logout, { isLoading }] = useLogoutMutation();

  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4">
        <Link href="/dashboard" className="text-lg font-bold tracking-tight">
          Mess<span className="text-primary">ora</span>
        </Link>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-muted sm:inline">{user?.name}</span>
          <Button
            variant="outline"
            className="h-8 px-3"
            loading={isLoading}
            // <RequireAuth> redirects to /login once the session is cleared.
            onClick={() => logout()}
          >
            Log out
          </Button>
        </div>
      </div>
    </header>
  );
}
