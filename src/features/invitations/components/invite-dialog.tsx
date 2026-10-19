"use client";

import { useState, type ReactNode } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CircleAlert, CircleCheck, Copy, MessageCircle } from "lucide-react";
import { ResponsiveDialog } from "@/components/common/responsive-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCurrentMess, useMessPermissions } from "@/features/messes/mess-context";
import { useShare, whatsappShareUrl } from "@/hooks/use-share";
import { applyFieldErrors, getErrorMessage, type RequestError } from "@/lib/api-error";
import { useCreateInvitationMutation } from "../invitations-api";
import type { CreatedInvitation } from "../invitations-types";
import { inviteSchema, type InviteValues } from "../invitations-schemas";

/**
 * Invite someone by phone or email. Afterwards the link is shown for sharing on WhatsApp/SMS,
 * since phone invitations aren't sent automatically.
 */
export function InviteDialog({ trigger }: { trigger: (open: () => void) => ReactNode }) {
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<CreatedInvitation | null>(null);

  const onOpenChange = (next: boolean) => {
    setOpen(next);
    // Reset after the closing animation so the content doesn't jump while it fades out.
    if (!next) setTimeout(() => setResult(null), 200);
  };

  return (
    <>
      {trigger(() => setOpen(true))}
      <ResponsiveDialog
        open={open}
        onOpenChange={onOpenChange}
        title={result ? "Invitation ready" : "Invite a member"}
        description={
          result
            ? "Share the link with them. It works once and expires in 7 days."
            : "They'll join right away when they accept, with no approval needed."
        }
      >
        {result ? (
          <InviteResult
            result={result}
            onDone={() => onOpenChange(false)}
            onAnother={() => setResult(null)}
          />
        ) : (
          <InviteForm onCreated={setResult} />
        )}
      </ResponsiveDialog>
    </>
  );
}

function InviteForm({ onCreated }: { onCreated: (result: CreatedInvitation) => void }) {
  const mess = useCurrentMess();
  const { isAdmin } = useMessPermissions();
  const [createInvitation, { isLoading }] = useCreateInvitationMutation();
  const [formError, setFormError] = useState<RequestError>();

  const form = useForm<InviteValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { channel: "phone", phone: "", email: "", role: "MEMBER" },
  });
  const channel = useWatch({ control: form.control, name: "channel" });

  const onSubmit = form.handleSubmit(async ({ channel, phone, email, role }) => {
    setFormError(undefined);
    const res = await createInvitation({
      messId: mess.id,
      role,
      ...(channel === "phone" ? { phone } : { email }),
    });
    if (res.error) {
      if (!applyFieldErrors(res.error, form.setError)) setFormError(res.error);
      return;
    }
    onCreated(res.data);
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="grid gap-5" noValidate>
        {formError && (
          <Alert variant="destructive">
            <CircleAlert />
            <AlertDescription>{getErrorMessage(formError)}</AlertDescription>
          </Alert>
        )}

        <Tabs value={channel} onValueChange={(v) => form.setValue("channel", v as InviteValues["channel"])}>
          <TabsList className="w-full">
            <TabsTrigger value="phone">Phone</TabsTrigger>
            <TabsTrigger value="email">Email</TabsTrigger>
          </TabsList>
        </Tabs>

        {channel === "phone" ? (
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone number</FormLabel>
                <FormControl>
                  <Input type="tel" inputMode="tel" placeholder="01XXXXXXXXX" autoFocus {...field} />
                </FormControl>
                <FormDescription>You&apos;ll get a link to send them on WhatsApp or SMS.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : (
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="name@example.com" autoFocus {...field} />
                </FormControl>
                <FormDescription>We&apos;ll email them the invitation.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {isAdmin && (
          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Role</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="MEMBER">Member</SelectItem>
                    <SelectItem value="MANAGER">Manager: handles meals, bazar and deposits</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
        )}

        <Button type="submit" loading={isLoading}>
          Create invitation
        </Button>
      </form>
    </Form>
  );
}

function InviteResult({
  result,
  onDone,
  onAnother,
}: {
  result: CreatedInvitation;
  onDone: () => void;
  onAnother: () => void;
}) {
  const mess = useCurrentMess();
  const { copy } = useShare();
  const message = `You're invited to join ${mess.name} on Messora: ${result.inviteUrl}`;

  return (
    <div className="grid gap-4">
      {result.emailSent && (
        <Alert variant="success">
          <CircleCheck />
          <AlertDescription>We emailed the invitation to {result.invitation.email}.</AlertDescription>
        </Alert>
      )}
      <div className="flex gap-2">
        <Input
          readOnly
          value={result.inviteUrl}
          aria-label="Invitation link"
          onFocus={(e) => e.target.select()}
        />
        <Button
          variant="outline"
          size="icon"
          aria-label="Copy link"
          onClick={() => copy(result.inviteUrl, "Link copied")}
        >
          <Copy />
        </Button>
      </div>
      <Button asChild>
        <a href={whatsappShareUrl(message)} target="_blank" rel="noopener noreferrer">
          <MessageCircle />
          Send on WhatsApp
        </a>
      </Button>
      <div className="flex justify-between gap-2">
        <Button variant="ghost" onClick={onAnother}>
          Invite someone else
        </Button>
        <Button variant="outline" onClick={onDone}>
          Done
        </Button>
      </div>
    </div>
  );
}
