import type { Metadata } from "next";
import { VerifyEmailForm } from "@/features/auth/components/verify-email-form";

export const metadata: Metadata = { title: "Verify email" };

export default function VerifyEmailPage() {
  return (
    <div className="mx-auto w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-sm">
      <VerifyEmailForm />
    </div>
  );
}
