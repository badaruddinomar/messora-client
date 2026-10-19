"use client";

import Link from "next/link";
import { ChevronRight, Clock, KeyRound, MapPin, Plus, Users } from "lucide-react";
import { toast } from "sonner";
import { ErrorState } from "@/components/common/error-state";
import { MessTile } from "@/components/common/mess-tile";
import { PageHeader } from "@/components/common/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { messRoutes, ROUTES } from "@/constants/routes";
import { EmailVerificationBanner } from "@/features/auth/components/email-verification-banner";
import { selectUser } from "@/features/auth/auth-slice";
import { ReceivedInvitations } from "@/features/invitations/components/received-invitations";
import { getErrorMessage } from "@/lib/api-error";
import { useAppSelector } from "@/store/hooks";
import { useCancelJoinRequestMutation, useMyMessesQuery } from "../messes-api";
import type { Mess } from "../messes-types";
import { ROLE_LABELS } from "../utils";

/** Lists the user's messes and pending requests, plus ways to create or join one. */
export function MessesHub() {
  const user = useAppSelector(selectUser);
  const { data: messes, isLoading, error, refetch, isFetching } = useMyMessesQuery();

  const active = messes?.filter((m) => m.membership.status !== "PENDING") ?? [];
  const pending = messes?.filter((m) => m.membership.status === "PENDING") ?? [];
  const isEmpty = !isLoading && !error && messes?.length === 0;

  return (
    <div className="grid gap-8">
      <PageHeader
        title={isEmpty ? `Welcome, ${user?.name.split(" ")[0] ?? ""} 👋` : "My messes"}
        description={isEmpty ? "Let's get your mess set up." : "Switch between messes, or start a new one."}
        actions={
          !isEmpty && (
            <>
              <Button variant="outline" asChild>
                <Link href={ROUTES.join}>
                  <KeyRound />
                  Join with a code
                </Link>
              </Button>
              <Button asChild>
                <Link href={ROUTES.newMess}>
                  <Plus />
                  Create a mess
                </Link>
              </Button>
            </>
          )
        }
      />

      <EmailVerificationBanner />
      <ReceivedInvitations />

      {error ? (
        <ErrorState error={error} onRetry={refetch} retrying={isFetching} />
      ) : isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
        </div>
      ) : isEmpty ? (
        <GetStarted />
      ) : (
        <>
          {pending.length > 0 && (
            <section aria-labelledby="pending" className="grid gap-3">
              <h2 id="pending" className="text-sm font-medium text-muted-foreground">
                Waiting for approval
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {pending.map((m) => (
                  <PendingCard key={m.id} mess={m} />
                ))}
              </div>
            </section>
          )}
          {active.length > 0 && (
            <section aria-labelledby="yours" className="grid gap-3">
              <h2 id="yours" className="text-sm font-medium text-muted-foreground">
                Your messes
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {active.map((m) => (
                  <MessCard key={m.id} mess={m} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function MessCard({ mess }: { mess: Mess }) {
  const suspended = mess.membership.status === "SUSPENDED";
  const body = (
    <Card className="group flex-row items-center gap-4 px-5 transition-[box-shadow,border-color] duration-200 hover:border-primary/30 hover:shadow-sm">
      <MessTile name={mess.name} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{mess.name}</p>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {mess.address && (
            <span className="inline-flex min-w-0 items-center gap-1">
              <MapPin className="size-3 shrink-0" aria-hidden />
              <span className="truncate">{mess.address}</span>
            </span>
          )}
          <span className="inline-flex items-center gap-1">
            <Users className="size-3" aria-hidden />
            {mess.activeMemberCount} {mess.activeMemberCount === 1 ? "member" : "members"}
          </span>
        </div>
      </div>
      {suspended ? (
        <Badge variant="destructive">Suspended</Badge>
      ) : (
        <>
          <Badge variant="secondary">{ROLE_LABELS[mess.membership.role]}</Badge>
          <ChevronRight
            className="size-4 text-muted-foreground transition-transform duration-150 group-hover:translate-x-0.5"
            aria-hidden
          />
        </>
      )}
    </Card>
  );
  if (suspended) return body;
  return (
    <Link
      href={messRoutes(mess.slug).overview}
      className="rounded-xl focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:outline-none"
    >
      {body}
    </Link>
  );
}

function PendingCard({ mess }: { mess: Mess }) {
  const [cancel, { isLoading }] = useCancelJoinRequestMutation();
  return (
    <Card className="flex-row items-center gap-4 border-dashed px-5">
      <MessTile name={mess.name} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{mess.name}</p>
        <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="size-3" aria-hidden />A manager will review your request
        </p>
      </div>
      <Button
        variant="ghost"
        size="sm"
        loading={isLoading}
        onClick={async () => {
          const res = await cancel(mess.id);
          if (res.error) toast.error(getErrorMessage(res.error));
          else toast.success("Request cancelled");
        }}
      >
        Cancel
      </Button>
    </Card>
  );
}

/** First-run choice between creating and joining a mess. */
function GetStarted() {
  const options = [
    {
      href: ROUTES.newMess,
      icon: Plus,
      title: "Create a mess",
      text: "Set up your mess, meal times and billing month, then invite members.",
      cta: "Create a mess",
    },
    {
      href: ROUTES.join,
      icon: KeyRound,
      title: "Join with a code",
      text: "Got a join code from your manager? Enter it to ask to join.",
      cta: "Enter join code",
    },
  ];
  return (
    <section aria-labelledby="get-started" className="grid gap-4">
      <h2 id="get-started" className="text-sm font-medium text-muted-foreground">
        Get started
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {options.map(({ href, icon: Icon, title, text, cta }, i) => (
          <Card key={href} className="px-5 transition-shadow duration-200 hover:shadow-sm">
            <span className="flex size-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
              <Icon className="size-5" aria-hidden />
            </span>
            <div className="space-y-1">
              <h3 className="font-semibold">{title}</h3>
              <p className="text-sm text-muted-foreground">{text}</p>
            </div>
            <Button asChild variant={i === 0 ? "default" : "outline"} className="w-full">
              <Link href={href}>{cta}</Link>
            </Button>
          </Card>
        ))}
      </div>
    </section>
  );
}
