"use client";

import { useState } from "react";
import { Copy, KeyRound, RefreshCw, Share2 } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useShare } from "@/hooks/use-share";
import { getErrorMessage } from "@/lib/api-error";
import { useCurrentMess } from "../mess-context";
import { useRegenerateJoinCodeMutation } from "../messes-api";
import { joinLink } from "../utils";

/** The mess join code, with copy / share / regenerate. Managers only. */
export function JoinCodeCard() {
  const mess = useCurrentMess();
  const { copy, share } = useShare();
  const [regenerate] = useRegenerateJoinCodeMutation();
  const [confirmOpen, setConfirmOpen] = useState(false);
  if (!mess.joinCode) return null;

  // Built on click: window isn't available while rendering on the server.
  const link = () => joinLink(window.location.origin, mess.joinCode!);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <KeyRound className="size-4 text-muted-foreground" aria-hidden />
          Join code
        </CardTitle>
        <CardDescription>Share it with people who should join. You approve each request.</CardDescription>
        <CardAction>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Change join code"
                onClick={() => setConfirmOpen(true)}
              >
                <RefreshCw />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Change code</TooltipContent>
          </Tooltip>
        </CardAction>
      </CardHeader>
      <CardContent className="grid gap-4">
        <button
          type="button"
          onClick={() => copy(mess.joinCode!, "Join code copied")}
          className="group rounded-lg border border-dashed bg-muted/40 py-4 text-center font-mono text-2xl font-semibold tracking-[0.35em] transition-colors hover:border-primary/40 hover:bg-accent/40 focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:outline-none"
          aria-label={`Join code ${mess.joinCode}. Click to copy.`}
        >
          {mess.joinCode}
        </button>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={() => copy(link(), "Join link copied")}>
            <Copy />
            Copy link
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              share({
                title: `Join ${mess.name} on Messora`,
                text: `Join ${mess.name} on Messora with code ${mess.joinCode}:`,
                url: link(),
              })
            }
          >
            <Share2 />
            Share
          </Button>
        </div>
      </CardContent>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Change the join code?"
        description="The current code and join links stop working right away. People who already asked to join keep their request."
        confirmLabel="Change code"
        onConfirm={async () => {
          const res = await regenerate(mess.id);
          if (res.error) toast.error(getErrorMessage(res.error));
          else toast.success("New join code ready");
        }}
      />
    </Card>
  );
}
