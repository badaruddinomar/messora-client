"use client";

import { useState } from "react";
import { Ban, Ellipsis, RotateCcw, ShieldCheck, UserMinus, UserRound, UserCog } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCurrentMess } from "@/features/messes/mess-context";
import type { MessRole } from "@/features/messes/messes-types";
import { ROLE_LABELS } from "@/features/messes/utils";
import { getErrorMessage } from "@/lib/api-error";
import {
  useChangeMemberRoleMutation,
  useRemoveMemberMutation,
  useSetMemberSuspendedMutation,
} from "../members-api";
import type { Member } from "../members-types";

const ROLE_ICONS = { ADMIN: ShieldCheck, MANAGER: UserCog, MEMBER: UserRound } as const;

/** Admin actions for one member: change role, suspend / reactivate, remove. */
export function MemberActions({ member }: { member: Member }) {
  const mess = useCurrentMess();
  const [changeRole] = useChangeMemberRoleMutation();
  const [setSuspended] = useSetMemberSuspendedMutation();
  const [removeMember] = useRemoveMemberMutation();
  const [confirm, setConfirm] = useState<"suspend" | "remove" | null>(null);
  const [reason, setReason] = useState("");

  const args = { messId: mess.id, memberId: member.id };
  const name = member.user.name.split(" ")[0];

  const run = async (action: Promise<{ error?: unknown }>, success: string) => {
    const res = await action;
    if (res.error) {
      toast.error(getErrorMessage(res.error as Parameters<typeof getErrorMessage>[0]));
      throw res.error; // keeps the confirm dialog open
    }
    toast.success(success);
  };

  const suspended = member.status === "SUSPENDED";

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${member.user.name}`}>
            <Ellipsis />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {!suspended && (
            <>
              <DropdownMenuLabel>Change role</DropdownMenuLabel>
              {(["ADMIN", "MANAGER", "MEMBER"] as MessRole[])
                .filter((r) => r !== member.role)
                .map((role) => {
                  const Icon = ROLE_ICONS[role];
                  return (
                    <DropdownMenuItem
                      key={role}
                      onSelect={() =>
                        run(
                          changeRole({ ...args, role }),
                          `${name} is now ${ROLE_LABELS[role].toLowerCase()}`,
                        ).catch(() => undefined)
                      }
                    >
                      <Icon />
                      Make {ROLE_LABELS[role].toLowerCase()}
                    </DropdownMenuItem>
                  );
                })}
              <DropdownMenuSeparator />
            </>
          )}
          {suspended ? (
            <DropdownMenuItem
              onSelect={() =>
                run(setSuspended({ ...args, suspended: false }), `${name} can use the mess again`).catch(
                  () => undefined,
                )
              }
            >
              <RotateCcw />
              Reactivate
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onSelect={() => setConfirm("suspend")}>
              <Ban />
              Suspend
            </DropdownMenuItem>
          )}
          <DropdownMenuItem variant="destructive" onSelect={() => setConfirm("remove")}>
            <UserMinus />
            Remove from mess
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={confirm === "suspend"}
        onOpenChange={(open) => !open && setConfirm(null)}
        title={`Suspend ${member.user.name}?`}
        description="They won't be able to use the mess until you reactivate them. Their records stay as they are."
        confirmLabel="Suspend"
        destructive
        onConfirm={() => run(setSuspended({ ...args, suspended: true }), `${name} is suspended`)}
      />

      <ConfirmDialog
        open={confirm === "remove"}
        onOpenChange={(open) => {
          if (!open) {
            setConfirm(null);
            setReason("");
          }
        }}
        title={`Remove ${member.user.name}?`}
        description="They'll leave the mess today. Their meals, deposits and past bills stay in the records, and they can ask to join again later."
        confirmLabel="Remove member"
        destructive
        onConfirm={() => run(removeMember({ ...args, reason: reason || undefined }), `${name} was removed`)}
      >
        <div className="grid gap-2">
          <Label htmlFor="remove-reason">
            Reason <span className="font-normal text-muted-foreground">(optional)</span>
          </Label>
          <Textarea
            id="remove-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Moved out"
            maxLength={200}
          />
        </div>
      </ConfirmDialog>
    </>
  );
}
