"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CircleAlert, MoreHorizontal, Plus, Tag } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { MoneyInput } from "@/components/common/money-input";
import { MoneyText } from "@/components/common/money-text";
import { ResponsiveDialog } from "@/components/common/responsive-dialog";
import { UserAvatar } from "@/components/common/user-avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioCard, RadioGroup } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useMembersQuery } from "@/features/members/members-api";
import { useCurrentMess, useMessPermissions } from "@/features/messes/mess-context";
import type { Month } from "@/features/months/months-types";
import { isMonthEditable } from "@/features/months/utils";
import { applyFieldErrors, getErrorMessage, type RequestError } from "@/lib/api-error";
import { formatDate, formatMoney, isNegative } from "@/lib/format";
import {
  useChargesQuery,
  useCreateChargeMutation,
  useDeleteChargeMutation,
  useUpdateChargeMutation,
} from "../expenses-api";
import { chargeFormSchema, type ChargeFormValues } from "../expenses-schemas";
import { CHARGE_LABELS, type Charge } from "../expenses-types";

/** Fines, personal charges, adjustments and seat rent: yours, or everyone's for managers. */
export function ChargesTab({ month }: { month: Month | undefined }) {
  const mess = useCurrentMess();
  const { canManage } = useMessPermissions();
  const { data, isLoading, error, refetch, isFetching } = useChargesQuery(
    { messId: mess.id, monthId: month?.id },
    { skip: !month },
  );
  const [editing, setEditing] = useState<Charge | "new" | null>(null);
  const editable = !!month && isMonthEditable(month) && canManage;

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {canManage ? "Charges this month" : "Your charges this month"}:{" "}
          {data ? <MoneyText value={data.total} className="font-semibold text-foreground" /> : "…"}
          <span className="block text-xs">Seat rent is added when the month is closed.</span>
        </p>
        {editable && (
          <Button onClick={() => setEditing("new")}>
            <Plus />
            Add charge
          </Button>
        )}
      </div>
      {error ? (
        <ErrorState error={error} onRetry={refetch} retrying={isFetching} />
      ) : isLoading || !data ? (
        <Skeleton className="h-40 rounded-xl" />
      ) : data.items.length === 0 ? (
        <EmptyState
          icon={Tag}
          title="No charges this month"
          description="Fines, personal charges and adjustments for one member show up here."
        />
      ) : (
        <Card className="gap-0 py-0">
          <ul className="divide-y">
            {data.items.map((c) => (
              <ChargeRow key={c.id} charge={c} showMember={canManage} onEdit={() => setEditing(c)} />
            ))}
          </ul>
        </Card>
      )}
      <ResponsiveDialog
        open={editing !== null}
        onOpenChange={(o) => !o && setEditing(null)}
        title={editing === "new" ? "Add a charge" : "Edit charge"}
        description="Something one member pays (or gets back) on top of the shared costs."
      >
        {editing !== null && month && (
          <ChargeForm
            month={month}
            charge={editing === "new" ? undefined : editing}
            onDone={() => setEditing(null)}
          />
        )}
      </ResponsiveDialog>
    </div>
  );
}

function ChargeRow({
  charge,
  showMember,
  onEdit,
}: {
  charge: Charge;
  showMember: boolean;
  onEdit: () => void;
}) {
  const mess = useCurrentMess();
  const [deleteCharge] = useDeleteChargeMutation();
  const [confirming, setConfirming] = useState(false);
  const credit = isNegative(charge.amount);

  const onDelete = async () => {
    const res = await deleteCharge({ messId: mess.id, chargeId: charge.id });
    if (res.error) {
      toast.error(getErrorMessage(res.error));
      throw res.error;
    }
    toast.success("Charge removed");
  };

  return (
    <li className="flex items-center gap-3 px-4 py-3 sm:px-6">
      {showMember && <UserAvatar name={charge.member.name} src={charge.member.avatarUrl} size="sm" />}
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-2 text-sm">
          {showMember && <span className="font-medium">{charge.member.name}</span>}
          <Badge variant={charge.type === "FINE" ? "warning" : credit ? "success" : "muted"}>
            {CHARGE_LABELS[charge.type]}
          </Badge>
          {charge.isProrated && <span className="text-xs text-muted-foreground">prorated</span>}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {charge.description}
          {charge.periodFrom &&
            charge.periodTo &&
            ` · ${formatDate(charge.periodFrom, "d MMM")} – ${formatDate(charge.periodTo, "d MMM")}`}
        </p>
      </div>
      <span className={credit ? "tabular font-semibold text-success" : "tabular font-semibold"}>
        {credit ? `−${formatMoney(charge.amount)}` : formatMoney(charge.amount)}
      </span>
      {charge.canEdit && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Charge options">
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={onEdit}>Edit</DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onSelect={() => setConfirming(true)}>
              Remove
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title="Remove this charge?"
        description={`${charge.member.name}'s bill changes by ${formatMoney(charge.amount)}.`}
        confirmLabel="Remove charge"
        destructive
        onConfirm={onDelete}
      />
    </li>
  );
}

function ChargeForm({ month, charge, onDone }: { month: Month; charge?: Charge; onDone: () => void }) {
  const mess = useCurrentMess();
  const { data: members } = useMembersQuery({ messId: mess.id });
  const [createCharge, { isLoading: creating }] = useCreateChargeMutation();
  const [updateCharge, { isLoading: updating }] = useUpdateChargeMutation();
  const [formError, setFormError] = useState<RequestError>();

  const form = useForm<ChargeFormValues>({
    resolver: zodResolver(chargeFormSchema),
    defaultValues: {
      memberId: charge?.member.id ?? "",
      type: charge && charge.type !== "SEAT_RENT" ? charge.type : "FINE",
      direction: charge && isNegative(charge.amount) ? "credit" : "charge",
      amount: charge?.amount.replace("-", "") ?? "",
      description: charge?.description ?? "",
    },
  });
  const type = useWatch({ control: form.control, name: "type" });

  const onSubmit = form.handleSubmit(async (v) => {
    setFormError(undefined);
    const amount = v.type === "ADJUSTMENT" && v.direction === "credit" ? `-${v.amount}` : v.amount;
    const res = charge
      ? await updateCharge({ messId: mess.id, chargeId: charge.id, amount, description: v.description })
      : await createCharge({
          messId: mess.id,
          monthId: month.id,
          memberId: v.memberId,
          type: v.type,
          amount,
          description: v.description,
        });
    if (res.error) {
      if (!applyFieldErrors(res.error, form.setError)) setFormError(res.error);
      return;
    }
    toast.success(charge ? "Charge updated" : "Charge added");
    onDone();
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
        {!charge && (
          <>
            <FormField
              control={form.control}
              name="memberId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Member</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Pick a member" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {members?.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.user.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <FormControl>
                    <RadioGroup
                      value={field.value}
                      onValueChange={field.onChange}
                      className="grid grid-cols-3 gap-2"
                    >
                      <RadioCard value="FINE" title="Fine" className="items-center p-3" />
                      <RadioCard value="PERSONAL" title="Personal" className="items-center p-3" />
                      <RadioCard value="ADJUSTMENT" title="Adjustment" className="items-center p-3" />
                    </RadioGroup>
                  </FormControl>
                </FormItem>
              )}
            />
          </>
        )}
        {type === "ADJUSTMENT" && (
          <FormField
            control={form.control}
            name="direction"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Adjustment</FormLabel>
                <FormControl>
                  <RadioGroup
                    value={field.value}
                    onValueChange={field.onChange}
                    className="grid grid-cols-2 gap-2"
                  >
                    <RadioCard value="charge" title="Add to the bill" className="p-3" />
                    <RadioCard value="credit" title="Take off the bill" className="p-3" />
                  </RadioGroup>
                </FormControl>
              </FormItem>
            )}
          />
        )}
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount</FormLabel>
              <FormControl>
                <MoneyInput placeholder="0" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>What it&apos;s for</FormLabel>
              <FormControl>
                <Input
                  placeholder={
                    type === "FINE" ? "Paid late" : type === "PERSONAL" ? "Extra milk" : "Fixed the tap"
                  }
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onDone}>
            Cancel
          </Button>
          <Button type="submit" loading={creating || updating}>
            {charge ? "Save charge" : "Add charge"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
