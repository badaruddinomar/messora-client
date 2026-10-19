import { Suspense } from "react";
import type { Metadata } from "next";
import { Logo } from "@/components/common/logo";
import { FullPageSpinner } from "@/components/ui/spinner";
import { InvitationLanding } from "@/features/invitations/components/invitation-landing";

export const metadata: Metadata = { title: "You're invited" };

/** Public page: shows the invitation before the person logs in or signs up. */
export default function InvitePage() {
  return (
    <main className="flex min-h-svh flex-col items-center px-4 py-8">
      <Logo />
      <div className="flex w-full max-w-md flex-1 flex-col justify-center py-10">
        {/* The token comes from the URL, which is only known at request time. */}
        <Suspense fallback={<FullPageSpinner />}>
          <InvitationLanding />
        </Suspense>
      </div>
    </main>
  );
}
