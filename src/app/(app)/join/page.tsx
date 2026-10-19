import { Suspense } from "react";
import type { Metadata } from "next";
import { FullPageSpinner } from "@/components/ui/spinner";
import { JoinMessForm } from "@/features/messes/components/join-mess-form";

export const metadata: Metadata = { title: "Join a mess" };

export default function JoinPage() {
  return (
    // The form reads ?code= from the URL (nuqs), which needs a Suspense boundary.
    <Suspense fallback={<FullPageSpinner />}>
      <JoinMessForm />
    </Suspense>
  );
}
