"use client";

import Link from "next/link";
import { type Building2, KeyRound, MailWarning, Plus } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ROUTES } from "@/constants/routes";
import { selectUser } from "@/features/auth/auth-slice";
import { useAppSelector } from "@/store/hooks";

export function DashboardHome() {
  const user = useAppSelector(selectUser);
  if (!user) return null;

  const needsEmailVerification = !!user.email && !user.emailVerifiedAt;

  return (
    <div className="grid gap-8">
      <PageHeader
        title={`Hi, ${user.name.split(" ")[0]} 👋`}
        description="Welcome to Messora. Let's get your mess set up."
      />

      {needsEmailVerification && (
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
      )}

      <section aria-labelledby="get-started" className="grid gap-4">
        <h2 id="get-started" className="text-sm font-medium text-muted-foreground">
          Get started
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <OnboardingCard
            icon={Plus}
            title="Create a mess"
            description="Set up your mess, meal times and billing month, then invite members."
          />
          <OnboardingCard
            icon={KeyRound}
            title="Join with a code"
            description="Got a join code from your manager? Enter it to request to join."
          />
        </div>
      </section>
    </div>
  );
}

function OnboardingCard({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Building2;
  title: string;
  description: string;
}) {
  return (
    <Card className="relative transition-shadow duration-200 hover:shadow-sm">
      <CardHeader>
        <span className="mb-3 flex size-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
          <Icon className="size-5" aria-hidden />
        </span>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Enabled in Phase 2 (mess & membership). */}
        <Button variant="secondary" disabled className="w-full">
          Coming in the next update
        </Button>
      </CardContent>
    </Card>
  );
}
