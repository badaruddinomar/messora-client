"use client";

import Link from "next/link";
import { MailWarning } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { useAppSelector } from "@/store/hooks";
import { selectUser } from "../auth-slice";

/** Nudges users with an unverified email to verify it (needed for password reset by email). */
export function EmailVerificationBanner() {
  const user = useAppSelector(selectUser);
  if (!user?.email || user.emailVerifiedAt) return null;

  return (
    <Alert variant="warning">
      <MailWarning />
      <AlertTitle>Verify your email</AlertTitle>
      <AlertDescription className="text-current/80">
        <p>
          Verify <span className="font-medium">{user.email}</span> so you can reset your password if you
          forget it.
        </p>
        <Button size="sm" variant="outline" asChild className="mt-2">
          <Link href={ROUTES.verifyEmail}>Verify email</Link>
        </Button>
      </AlertDescription>
    </Alert>
  );
}
