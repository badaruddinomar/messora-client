import type { Metadata } from "next";
import { VerifyEmailForm } from "@/features/auth/components/verify-email-form";

export const metadata: Metadata = { title: "Verify email" };

export default function VerifyEmailPage() {
  return (
    <div className="mx-auto w-full max-w-sm animate-in py-6 duration-300 fade-in-0 slide-in-from-bottom-2">
      <VerifyEmailForm />
    </div>
  );
}
