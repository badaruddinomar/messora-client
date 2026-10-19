"use client";

import Link from "next/link";
import { selectUser } from "@/features/auth/auth-slice";
import { useAppSelector } from "@/store/hooks";
import { ROUTES } from "@/constants/routes";

export function DashboardHome() {
  const user = useAppSelector(selectUser);
  if (!user) return null;

  const needsEmailVerification = !!user.email && !user.emailVerifiedAt;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Hi, {user.name.split(" ")[0]} 👋</h1>
        <p className="text-sm text-muted">Here&apos;s what&apos;s happening with your mess.</p>
      </div>

      {needsEmailVerification && (
        <div className="flex flex-col gap-3 rounded-xl border border-primary/30 bg-primary/10 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm">
            Verify <span className="font-medium">{user.email}</span> so you can reset your password if you forget it.
          </p>
          <Link
            href={ROUTES.verifyEmail}
            className="inline-flex h-9 shrink-0 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"
          >
            Verify email
          </Link>
        </div>
      )}

      <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center">
        <h2 className="font-medium">You&apos;re not in a mess yet</h2>
        <p className="mt-1 text-sm text-muted">Create a new mess or join one with a join code.</p>
      </div>
    </div>
  );
}
