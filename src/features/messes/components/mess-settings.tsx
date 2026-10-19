"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CircleAlert, Lock, LogOut, Trash2, UserRound, Users } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { ErrorState } from "@/components/common/error-state";
import { PageHeader } from "@/components/common/page-header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Label } from "@/components/ui/label";
import { RadioCard, RadioGroup } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { ROUTES } from "@/constants/routes";
import { applyFieldErrors, getErrorCode, getErrorMessage } from "@/lib/api-error";
import { useCurrentMess, useMessPermissions } from "../mess-context";
import {
  useDeleteMessMutation,
  useLeaveMessMutation,
  useMessSettingsQuery,
  useUpdateMessMutation,
  useUpdateMessSettingsMutation,
} from "../messes-api";
import { messDetailsSchema, type MessDetailsValues } from "../messes-schemas";
import type { MessSettings } from "../messes-types";
import { describeBillingMonth, formatStartDay, GENDER_LABELS } from "../utils";

const START_DAYS = Array.from({ length: 28 }, (_, i) => String(i + 1));

export function MessSettingsPage() {
  const { isAdmin } = useMessPermissions();
  return (
    <div className="mx-auto grid w-full max-w-2xl gap-6">
      <PageHeader
        title="Settings"
        description={isAdmin ? "Manage how your mess works." : "How this mess is set up."}
      />
      {!isAdmin && (
        <Alert>
          <Lock />
          <AlertDescription>Only admins can change these settings.</AlertDescription>
        </Alert>
      )}
      <DetailsCard readOnly={!isAdmin} />
      <RulesCard readOnly={!isAdmin} />
      <DangerZone />
    </div>
  );
}

// ---------- Details ----------

function DetailsCard({ readOnly }: { readOnly: boolean }) {
  const mess = useCurrentMess();
  const [updateMess, { isLoading }] = useUpdateMessMutation();
  const form = useForm<MessDetailsValues>({
    resolver: zodResolver(messDetailsSchema),
    values: {
      name: mess.name,
      address: mess.address ?? "",
      gender: mess.gender,
      monthStartDay: String(mess.monthStartDay),
    },
  });
  const startDayChanged =
    useWatch({ control: form.control, name: "monthStartDay" }) !== String(mess.monthStartDay);

  const onSubmit = form.handleSubmit(async (values) => {
    const res = await updateMess({
      messId: mess.id,
      name: values.name,
      address: values.address || null,
      gender: values.gender,
      monthStartDay: Number(values.monthStartDay),
    });
    if (res.error) {
      if (!applyFieldErrors(res.error, form.setError)) toast.error(getErrorMessage(res.error));
      return;
    }
    toast.success("Mess details saved");
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mess details</CardTitle>
        <CardDescription>Shown to members and on invitations.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={onSubmit} className="grid gap-5" noValidate>
            <fieldset disabled={readOnly} className="grid gap-5">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mess name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input placeholder="House, road, area" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type of mess</FormLabel>
                    <FormControl>
                      <RadioGroup
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={readOnly}
                        className="sm:grid-cols-3"
                      >
                        <RadioCard
                          value="MALE"
                          title={GENDER_LABELS.MALE}
                          icon={<UserRound className="size-4" />}
                        />
                        <RadioCard
                          value="FEMALE"
                          title={GENDER_LABELS.FEMALE}
                          icon={<UserRound className="size-4" />}
                        />
                        <RadioCard
                          value="MIXED"
                          title={GENDER_LABELS.MIXED}
                          icon={<Users className="size-4" />}
                        />
                      </RadioGroup>
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="monthStartDay"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Billing months start on the</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange} disabled={readOnly}>
                      <FormControl>
                        <SelectTrigger className="sm:w-64">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-72">
                        {START_DAYS.map((d) => (
                          <SelectItem key={d} value={d}>
                            {formatStartDay(Number(d))}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {describeBillingMonth(Number(field.value))}.
                      {startDayChanged &&
                        " The change applies from the next billing month; this month keeps its dates."}
                    </FormDescription>
                  </FormItem>
                )}
              />
            </fieldset>
            {!readOnly && (
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  disabled={!form.formState.isDirty || isLoading}
                  onClick={() => form.reset()}
                >
                  Discard
                </Button>
                <Button type="submit" loading={isLoading} disabled={!form.formState.isDirty}>
                  Save changes
                </Button>
              </div>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

// ---------- Rules ----------

const RULES: { key: keyof MessSettings; title: string; description: string }[] = [
  {
    key: "allowMemberMealEdit",
    title: "Members edit their own meals",
    description: "Members can turn their meals on or off until each meal's cutoff time.",
  },
  {
    key: "allowGuestMeal",
    title: "Guest meals",
    description: "Members can add meals for guests, charged to them.",
  },
  {
    key: "autoGenerateMeals",
    title: "Fill in meals automatically",
    description: "Every day, active members get their usual meals unless they're marked off.",
  },
  {
    key: "requireBazarApproval",
    title: "Approve bazar entries",
    description: "A manager approves each bazar before it counts toward the meal rate.",
  },
  {
    key: "requireDepositApproval",
    title: "Approve deposits",
    description: "A manager confirms each deposit before it counts toward a member's balance.",
  },
  {
    key: "prorateSeatRent",
    title: "Prorate seat rent",
    description: "Members who join or leave mid-month pay rent only for the days they stayed.",
  },
];

function RulesCard({ readOnly }: { readOnly: boolean }) {
  const mess = useCurrentMess();
  const { data: settings, isLoading, error, refetch, isFetching } = useMessSettingsQuery(mess.id);
  const [update, { isLoading: saving, originalArgs }] = useUpdateMessSettingsMutation();

  const toggle = async (key: keyof MessSettings, value: boolean) => {
    const res = await update({ messId: mess.id, [key]: value });
    if (res.error) toast.error(getErrorMessage(res.error));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rules</CardTitle>
        <CardDescription>Changes apply right away.</CardDescription>
      </CardHeader>
      <CardContent>
        {error ? (
          <ErrorState error={error} onRetry={refetch} retrying={isFetching} />
        ) : (
          <ul className="divide-y">
            {RULES.map((rule) => {
              const id = `rule-${rule.key}`;
              const pendingValue =
                saving && originalArgs && rule.key in originalArgs
                  ? (originalArgs[rule.key as keyof typeof originalArgs] as boolean)
                  : undefined;
              return (
                <li
                  key={rule.key}
                  className="flex items-start justify-between gap-6 py-4 first:pt-0 last:pb-0"
                >
                  <div className="space-y-0.5">
                    <Label htmlFor={id}>{rule.title}</Label>
                    <p className="text-sm text-muted-foreground">{rule.description}</p>
                  </div>
                  {isLoading || !settings ? (
                    <Skeleton className="h-6 w-11 rounded-full" />
                  ) : (
                    <Switch
                      id={id}
                      // Show the new value immediately while it saves.
                      checked={pendingValue ?? (settings[rule.key] as boolean)}
                      disabled={readOnly}
                      onCheckedChange={(v) => toggle(rule.key, v)}
                    />
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

// ---------- Danger zone ----------

function DangerZone() {
  const router = useRouter();
  const mess = useCurrentMess();
  const { isAdmin } = useMessPermissions();
  const [leave] = useLeaveMessMutation();
  const [deleteMess] = useDeleteMessMutation();
  const [dialog, setDialog] = useState<"leave" | "delete" | null>(null);
  const [confirmName, setConfirmName] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const close = () => {
    setDialog(null);
    setConfirmName("");
    setDeleteError(null);
  };

  return (
    <Card className="border-destructive/30">
      <CardHeader>
        <CardTitle className="text-destructive">Danger zone</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium">Leave this mess</p>
            <p className="text-sm text-muted-foreground">
              Your past records stay; you can ask to join again later.
            </p>
          </div>
          <Button variant="outline" onClick={() => setDialog("leave")} className="shrink-0">
            <LogOut />
            Leave mess
          </Button>
        </div>
        {isAdmin && (
          <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium">Delete this mess</p>
              <p className="text-sm text-muted-foreground">
                It disappears for every member. This can&apos;t be undone.
              </p>
            </div>
            <Button variant="destructive" onClick={() => setDialog("delete")} className="shrink-0">
              <Trash2 />
              Delete mess
            </Button>
          </div>
        )}
      </CardContent>

      <ConfirmDialog
        open={dialog === "leave"}
        onOpenChange={(open) => !open && close()}
        title={`Leave ${mess.name}?`}
        description="You'll lose access to this mess today. Your meals, deposits and past bills stay in its records."
        confirmLabel="Leave mess"
        destructive
        onConfirm={async () => {
          const res = await leave({ messId: mess.id });
          if (res.error) {
            // The last admin can't leave; explain what to do instead.
            toast.error(
              getErrorCode(res.error) === "LAST_ADMIN"
                ? "You're the only admin. Make someone else an admin first, or delete the mess."
                : getErrorMessage(res.error),
            );
            throw res.error;
          }
          toast.success(`You left ${mess.name}`);
          router.replace(ROUTES.messes);
        }}
      />

      <ConfirmDialog
        open={dialog === "delete"}
        onOpenChange={(open) => !open && close()}
        title={`Delete ${mess.name}?`}
        description="All members lose access immediately. Type the mess name to confirm."
        confirmLabel="Delete mess"
        destructive
        onConfirm={async () => {
          const res = await deleteMess({ messId: mess.id, confirmName });
          if (res.error) {
            setDeleteError(getErrorMessage(res.error));
            throw res.error;
          }
          toast.success(`${mess.name} was deleted`);
          router.replace(ROUTES.messes);
        }}
      >
        <div className="grid gap-2">
          <Label htmlFor="confirm-name">Mess name</Label>
          <Input
            id="confirm-name"
            value={confirmName}
            onChange={(e) => {
              setConfirmName(e.target.value);
              setDeleteError(null);
            }}
            placeholder={mess.name}
            autoComplete="off"
          />
          {deleteError && (
            <p className="flex items-center gap-1.5 text-xs text-destructive">
              <CircleAlert className="size-3.5" aria-hidden />
              {deleteError}
            </p>
          )}
        </div>
      </ConfirmDialog>
    </Card>
  );
}
