"use client";

import { useRouter } from "next/navigation";
import { MailOpen } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { messRoutes } from "@/constants/routes";
import { ROLE_LABELS } from "@/features/messes/utils";
import { getErrorMessage } from "@/lib/api-error";
import { useReceivedInvitationsQuery, useRespondToInvitationMutation } from "../invitations-api";
import type { Invitation } from "../invitations-types";

/** Invitations sent to the user's phone or email, shown on the messes hub. */
export function ReceivedInvitations() {
  const { data: invitations } = useReceivedInvitationsQuery();
  if (!invitations?.length) return null;

  return (
    <section aria-labelledby="invitations" className="grid gap-3">
      <h2 id="invitations" className="text-sm font-medium text-muted-foreground">
        Invitations for you
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {invitations.map((inv) => (
          <InvitationCard key={inv.id} invitation={inv} />
        ))}
      </div>
    </section>
  );
}

function InvitationCard({ invitation }: { invitation: Invitation }) {
  const router = useRouter();
  const [respond, { isLoading, originalArgs }] = useRespondToInvitationMutation();

  const answer = async (accept: boolean) => {
    const res = await respond({ invitationId: invitation.id, accept });
    if (res.error) return toast.error(getErrorMessage(res.error));
    if (accept && res.data) {
      toast.success(`Welcome to ${invitation.mess.name}`);
      router.push(messRoutes(res.data.slug).overview);
    } else {
      toast.success("Invitation declined");
    }
  };

  return (
    <Card className="gap-4 border-primary/30 bg-accent/30 px-5">
      <div className="flex gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <MailOpen className="size-4" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="font-medium">{invitation.mess.name}</p>
          <p className="text-sm text-muted-foreground">
            {invitation.invitedBy} invited you as {ROLE_LABELS[invitation.role].toLowerCase()}
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        <Button
          className="flex-1"
          onClick={() => answer(true)}
          loading={isLoading && originalArgs?.accept === true}
          disabled={isLoading}
        >
          Join mess
        </Button>
        <Button
          variant="outline"
          onClick={() => answer(false)}
          loading={isLoading && originalArgs?.accept === false}
          disabled={isLoading}
        >
          Decline
        </Button>
      </div>
    </Card>
  );
}
