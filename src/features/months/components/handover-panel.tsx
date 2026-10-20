"use client";

import { useState } from "react";
import { ArrowRight, Banknote } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/common/empty-state";
import { MoneyInput } from "@/components/common/money-input";
import { MoneyText } from "@/components/common/money-text";
import { ResponsiveDialog } from "@/components/common/responsive-dialog";
import { UserAvatar } from "@/components/common/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useMembersQuery } from "@/features/members/members-api";
import { useCurrentMess, useMessPermissions } from "@/features/messes/mess-context";
import { getErrorMessage } from "@/lib/api-error";
import { formatDate, formatSignedMoney, isNegative, isZero } from "@/lib/format";
import { isMoney } from "@/lib/money";
import {
  useCreateHandoverMutation,
  useHandoversQuery,
  useMonthPreviewQuery,
  useRespondToHandoverMutation,
} from "../months-api";
import type { Handover, Month } from "../months-types";
import { monthLabel } from "../utils";

const STATUS = {
  PENDING: { label: "Waiting to confirm", variant: "warning" },
  CONFIRMED: { label: "Confirmed", variant: "success" },
  DISPUTED: { label: "Disputed", variant: "destructive" },
} as const;

/** Handing the mess's cash from one manager to the next, against what the app says there should be. */
export function HandoverPanel({ month }: { month: Month }) {
  const mess = useCurrentMess();
  const { canManage } = useMessPermissions();
  const { data: handovers, isLoading } = useHandoversQuery({ messId: mess.id, monthId: month.id });
  const { data: preview } = useMonthPreviewQuery({ messId: mess.id, monthId: month.id });
  const [creating, setCreating] = useState(false);
  const active = handovers?.some((h) => h.status !== "DISPUTED");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cash handover</CardTitle>
        <CardDescription>
          The mess should have {preview ? formatSignedMoney(preview.cash.closingCash) : "…"} in hand after{" "}
          {monthLabel(month)}.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {isLoading || !handovers ? (
          <Skeleton className="h-20" />
        ) : handovers.length === 0 ? (
          <EmptyState
            icon={Banknote}
            title="Not handed over yet"
            description="When the manager changes, record the cash passed to the next one."
            className="border-0 py-6"
          />
        ) : (
          <ul className="grid gap-3">
            {handovers.map((h) => (
              <HandoverRow key={h.id} handover={h} />
            ))}
          </ul>
        )}
        {canManage && !active && preview && (
          <Button className="justify-self-start" onClick={() => setCreating(true)}>
            <Banknote />
            Hand over cash
          </Button>
        )}
      </CardContent>
      {creating && preview && (
        <HandoverDialog
          month={month}
          expected={preview.cash.closingCash}
          onClose={() => setCreating(false)}
        />
      )}
    </Card>
  );
}

function HandoverRow({ handover: h }: { handover: Handover }) {
  const mess = useCurrentMess();
  const [respond, { isLoading }] = useRespondToHandoverMutation();
  const [disputing, setDisputing] = useState(false);
  const [note, setNote] = useState("");
  const status = STATUS[h.status];

  const answer = async (status: "CONFIRMED" | "DISPUTED") => {
    const res = await respond({ messId: mess.id, handoverId: h.id, status, note: note || null });
    if (res.error) return toast.error(getErrorMessage(res.error));
    toast.success(status === "CONFIRMED" ? "Cash confirmed" : "Marked as disputed");
    setDisputing(false);
  };

  return (
    <li className="grid gap-3 rounded-lg border p-3">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <UserAvatar name={h.from.name} src={h.from.avatarUrl} size="sm" />
        <span className="font-medium">{h.from.name}</span>
        <ArrowRight className="size-4 text-muted-foreground" aria-label="to" />
        <UserAvatar name={h.to.name} src={h.to.avatarUrl} size="sm" />
        <span className="font-medium">{h.to.name}</span>
        <Badge variant={status.variant} className="ml-auto">
          {status.label}
        </Badge>
      </div>
      <dl className="grid grid-cols-3 gap-2 text-sm">
        <div>
          <dt className="text-xs text-muted-foreground">Expected</dt>
          <dd>
            <MoneyText value={h.expectedAmount} />
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Handed</dt>
          <dd>
            <MoneyText value={h.handedAmount} className="font-semibold" />
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Difference</dt>
          <dd
            className={
              isZero(h.difference)
                ? "text-muted-foreground"
                : isNegative(h.difference)
                  ? "text-destructive"
                  : "text-success"
            }
          >
            {isZero(h.difference)
              ? "None"
              : `${isNegative(h.difference) ? "" : "+"}${formatSignedMoney(h.difference)}`}
          </dd>
        </div>
      </dl>
      {h.note && <p className="rounded-md bg-muted/40 px-3 py-2 text-sm">{h.note}</p>}
      <p className="text-xs text-muted-foreground">
        {formatDate(h.createdAt)}
        {h.confirmedAt && ` · confirmed ${formatDate(h.confirmedAt)}`}
      </p>
      {h.canRespond &&
        (disputing ? (
          <div className="grid gap-2">
            <Label htmlFor={`dispute-${h.id}`}>What&apos;s wrong?</Label>
            <Input
              id={`dispute-${h.id}`}
              value={note}
              placeholder="I only got ৳5,000"
              onChange={(e) => setNote(e.target.value)}
            />
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setDisputing(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                loading={isLoading}
                disabled={!note.trim()}
                onClick={() => answer("DISPUTED")}
              >
                Dispute
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button size="sm" loading={isLoading} onClick={() => answer("CONFIRMED")}>
              I got it
            </Button>
            <Button size="sm" variant="outline" onClick={() => setDisputing(true)}>
              Something&apos;s wrong
            </Button>
          </div>
        ))}
    </li>
  );
}

function HandoverDialog({
  month,
  expected,
  onClose,
}: {
  month: Month;
  expected: string;
  onClose: () => void;
}) {
  const mess = useCurrentMess();
  const { data: members } = useMembersQuery({ messId: mess.id });
  const [create, { isLoading }] = useCreateHandoverMutation();
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState(isNegative(expected) ? "0" : expected);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string>();

  const submit = async () => {
    if (!to) return setError("Pick who's taking over");
    if (!isMoney(amount)) return setError("Enter the amount handed over");
    const res = await create({
      messId: mess.id,
      monthId: month.id,
      toMemberId: to,
      handedAmount: amount,
      note: note || null,
    });
    if (res.error) return setError(getErrorMessage(res.error));
    toast.success("Cash handed over", { description: "They'll be asked to confirm it." });
    onClose();
  };

  return (
    <ResponsiveDialog
      open
      onOpenChange={(o) => !o && onClose()}
      title="Hand over the cash"
      description={`The mess should have ${formatSignedMoney(expected)} after ${monthLabel(month)}.`}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} loading={isLoading}>
            Hand over
          </Button>
        </>
      }
    >
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="handover-to">To</Label>
          <Select value={to} onValueChange={setTo}>
            <SelectTrigger id="handover-to" className="w-full">
              <SelectValue placeholder="The next manager" />
            </SelectTrigger>
            <SelectContent>
              {members
                ?.filter((m) => m.id !== mess.membership.id)
                .map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.user.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="handover-amount">Amount handed</Label>
          <MoneyInput id="handover-amount" value={amount} onChange={setAmount} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="handover-note">
            Note <span className="font-normal text-muted-foreground">(optional)</span>
          </Label>
          <Input
            id="handover-note"
            value={note}
            placeholder="Why it's different, if it is"
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    </ResponsiveDialog>
  );
}
