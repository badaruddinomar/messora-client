"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { CircleAlert, MapPin, Users } from "lucide-react";
import { toast } from "sonner";
import { DateText } from "@/components/common/date-text";
import { MessTile } from "@/components/common/mess-tile";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { messRoutes, ROUTES } from "@/constants/routes";
import { useAuthStatus } from "@/features/auth/hooks/use-auth-status";
import { ROLE_LABELS } from "@/features/messes/utils";
import { getErrorMessage } from "@/lib/api-error";
import {
  useAcceptInvitationLinkMutation,
  useDeclineInvitationLinkMutation,
  useInvitationPreviewQuery,
} from "../invitations-api";

const STATUS_MESSAGES = {
  ACCEPTED: "This invitation has already been used.",
  DECLINED: "This invitation was declined.",
  EXPIRED: "This invitation has expired. Ask your manager for a new one.",
  REVOKED: "This invitation was cancelled by the mess.",
} as const;

export function InvitationLanding() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const authStatus = useAuthStatus();
  const { data: invite, error, isLoading } = useInvitationPreviewQuery(token);
  const [accept, acceptState] = useAcceptInvitationLinkMutation();
  const [decline, declineState] = useDeclineInvitationLinkMutation();

  if (isLoading) return <Skeleton className="h-72 w-full rounded-xl" />;

  if (error || !invite) {
    return (
      <Card className="items-center px-6 py-10 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <CircleAlert className="size-6" aria-hidden />
        </span>
        <div className="space-y-1">
          <h1 className="text-xl font-semibold">Invitation not found</h1>
          <p className="text-sm text-muted-foreground">The link may be incomplete. Check it and try again.</p>
        </div>
        <Button asChild variant="outline">
          <Link href={ROUTES.home}>Go to Messora</Link>
        </Button>
      </Card>
    );
  }

  const usable = invite.status === "PENDING";
  const next = encodeURIComponent(ROUTES.invite(token));

  const onAccept = async () => {
    const res = await accept(token);
    if (res.error) return;
    toast.success(`Welcome to ${res.data.name}`);
    router.replace(messRoutes(res.data.slug).overview);
  };

  const onDecline = async () => {
    const res = await decline(token);
    if (!res.error) {
      toast.success("Invitation declined");
      router.replace(ROUTES.dashboard);
    }
  };

  const requestError = acceptState.error ?? declineState.error;

  return (
    <Card className="animate-in gap-6 px-6 py-8 duration-300 fade-in-0 slide-in-from-bottom-2">
      <div className="flex flex-col items-center gap-4 text-center">
        <MessTile name={invite.messName} />
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{invite.invitedBy} invited you to join</p>
          <h1 className="text-2xl font-semibold tracking-tight">{invite.messName}</h1>
        </div>
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          {invite.messAddress && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3.5" aria-hidden />
              {invite.messAddress}
            </span>
          )}
          <span className="inline-flex items-center gap-1">
            <Users className="size-3.5" aria-hidden />
            {invite.activeMemberCount} {invite.activeMemberCount === 1 ? "member" : "members"}
          </span>
        </div>
        {usable && (
          <p className="text-sm">
            You&apos;ll join as <span className="font-medium">{ROLE_LABELS[invite.role].toLowerCase()}</span>.
            The invitation expires <DateText value={invite.expiresAt} variant="relative" />.
          </p>
        )}
      </div>

      {!usable && (
        <Alert variant="warning">
          <CircleAlert />
          <AlertDescription className="text-current/80">
            {STATUS_MESSAGES[invite.status as keyof typeof STATUS_MESSAGES]}
          </AlertDescription>
        </Alert>
      )}
      {requestError && (
        <Alert variant="destructive">
          <CircleAlert />
          <AlertDescription>{getErrorMessage(requestError)}</AlertDescription>
        </Alert>
      )}

      {usable &&
        (authStatus === "unknown" ? (
          <Skeleton className="h-11 w-full" />
        ) : authStatus === "authenticated" ? (
          <div className="grid gap-2">
            <Button
              size="lg"
              onClick={onAccept}
              loading={acceptState.isLoading}
              disabled={declineState.isLoading}
            >
              Join {invite.messName}
            </Button>
            <Button
              variant="ghost"
              onClick={onDecline}
              loading={declineState.isLoading}
              disabled={acceptState.isLoading}
            >
              Decline
            </Button>
          </div>
        ) : (
          <div className="grid gap-2">
            <Button size="lg" asChild>
              <Link href={`${ROUTES.register}?next=${next}`}>Create an account to join</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`${ROUTES.login}?next=${next}`}>I already have an account</Link>
            </Button>
          </div>
        ))}
    </Card>
  );
}
