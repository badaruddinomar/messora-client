"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, CircleAlert, MoreHorizontal, Plus, UserRound } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { MoneyInput } from "@/components/common/money-input";
import { MoneyText } from "@/components/common/money-text";
import { ResponsiveDialog } from "@/components/common/responsive-dialog";
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
import { Label } from "@/components/ui/label";
import { RadioCard, RadioGroup } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentMess, useMessPermissions } from "@/features/messes/mess-context";
import type { Month } from "@/features/months/months-types";
import { isMonthEditable, monthLabel } from "@/features/months/utils";
import { applyFieldErrors, getErrorCode, getErrorMessage, type RequestError } from "@/lib/api-error";
import { todayIn } from "@/lib/date";
import { isMoney } from "@/lib/money";
import {
  useCreateStaffMutation,
  useDeleteStaffMutation,
  usePayStaffMutation,
  useStaffQuery,
  useUpdateStaffMutation,
} from "../expenses-api";
import { staffFormSchema, type StaffFormValues } from "../expenses-schemas";
import { SPLIT_LABELS, STAFF_ROLE_LABELS, type SplitType, type Staff } from "../expenses-types";

/** The mess's cook, maid and others; admins manage them, managers pay their salaries. */
export function StaffTab({ month }: { month: Month | undefined }) {
  const mess = useCurrentMess();
  const { isAdmin, canManage } = useMessPermissions();
  const {
    data: staff,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useStaffQuery({ messId: mess.id, monthId: month?.id }, { skip: !month });
  const [editing, setEditing] = useState<Staff | "new" | null>(null);
  const [paying, setPaying] = useState<Staff | null>(null);
  const canPay = canManage && !!month && isMonthEditable(month);

  return (
    <div className="grid gap-4">
      {isAdmin && (
        <Button className="justify-self-end" onClick={() => setEditing("new")}>
          <Plus />
          Add staff
        </Button>
      )}
      {error ? (
        <ErrorState error={error} onRetry={refetch} retrying={isFetching} />
      ) : isLoading || !staff ? (
        <Skeleton className="h-40 rounded-xl" />
      ) : staff.length === 0 ? (
        <EmptyState
          icon={UserRound}
          title="No staff yet"
          description={
            isAdmin
              ? "Add your cook or maid to pay their salary in one tap."
              : "An admin can add the mess's cook or maid."
          }
        />
      ) : (
        <Card className="gap-0 py-0">
          <ul className="divide-y">
            {staff.map((s) => (
              <li key={s.id} className="flex items-center gap-3 px-4 py-3 sm:px-6">
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="font-medium">{s.name}</span>
                    <Badge variant="muted">{STAFF_ROLE_LABELS[s.role]}</Badge>
                    {!s.isActive && <Badge variant="outline">Inactive</Badge>}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    <MoneyText value={s.monthlySalary} /> a month{s.phone && ` · ${s.phone}`}
                  </p>
                </div>
                {s.paidThisMonth ? (
                  <span className="flex items-center gap-1 text-xs font-medium text-success">
                    <Check className="size-3.5" aria-hidden />
                    Paid <MoneyText value={s.paidAmount} compact />
                  </span>
                ) : (
                  canPay &&
                  s.isActive && (
                    <Button size="sm" onClick={() => setPaying(s)}>
                      Pay
                    </Button>
                  )
                )}
                {isAdmin && (
                  <StaffMenu
                    staff={s}
                    onEdit={() => setEditing(s)}
                    onPay={canPay && s.isActive ? () => setPaying(s) : undefined}
                  />
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}
      <ResponsiveDialog
        open={editing !== null}
        onOpenChange={(o) => !o && setEditing(null)}
        title={editing === "new" ? "Add staff" : "Edit staff"}
        description="Their salary can be paid each month as a shared expense."
      >
        {editing !== null && (
          <StaffForm staff={editing === "new" ? undefined : editing} onDone={() => setEditing(null)} />
        )}
      </ResponsiveDialog>
      {paying && month && <PayStaffDialog staff={paying} month={month} onClose={() => setPaying(null)} />}
    </div>
  );
}

function StaffMenu({ staff, onEdit, onPay }: { staff: Staff; onEdit: () => void; onPay?: () => void }) {
  const mess = useCurrentMess();
  const [deleteStaff] = useDeleteStaffMutation();
  const [updateStaff] = useUpdateStaffMutation();
  const [confirming, setConfirming] = useState(false);

  const remove = async () => {
    const res = await deleteStaff({ messId: mess.id, staffId: staff.id });
    if (res.error) {
      toast.error(getErrorMessage(res.error));
      throw res.error;
    }
    toast.success(res.data.deactivated ? `${staff.name} marked inactive` : `${staff.name} removed`);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label={`Options for ${staff.name}`}>
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={onEdit}>Edit</DropdownMenuItem>
          {onPay && staff.paidThisMonth && <DropdownMenuItem onSelect={onPay}>Pay again</DropdownMenuItem>}
          {!staff.isActive ? (
            <DropdownMenuItem
              onSelect={() => updateStaff({ messId: mess.id, staffId: staff.id, isActive: true })}
            >
              Mark active
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem variant="destructive" onSelect={() => setConfirming(true)}>
              Remove
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={`Remove ${staff.name}?`}
        description="If they were ever paid, they're kept as inactive so past salaries keep their name."
        confirmLabel={`Remove ${staff.name}`}
        destructive
        onConfirm={remove}
      />
    </>
  );
}

function StaffForm({ staff, onDone }: { staff?: Staff; onDone: () => void }) {
  const mess = useCurrentMess();
  const [createStaff, { isLoading: creating }] = useCreateStaffMutation();
  const [updateStaff, { isLoading: updating }] = useUpdateStaffMutation();
  const [formError, setFormError] = useState<RequestError>();
  const form = useForm<StaffFormValues>({
    resolver: zodResolver(staffFormSchema),
    defaultValues: {
      name: staff?.name ?? "",
      phone: staff?.phone ?? "",
      role: staff?.role ?? "COOK",
      monthlySalary: staff?.monthlySalary ?? "",
    },
  });

  const onSubmit = form.handleSubmit(async (v) => {
    setFormError(undefined);
    const body = { ...v, phone: v.phone || null };
    const res = staff
      ? await updateStaff({ messId: mess.id, staffId: staff.id, ...body })
      : await createStaff({ messId: mess.id, ...body });
    if (res.error) {
      if (!applyFieldErrors(res.error, form.setError)) setFormError(res.error);
      return;
    }
    toast.success(staff ? "Staff updated" : "Staff added");
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
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Rahima Khala" autoFocus {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Role</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(STAFF_ROLE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="monthlySalary"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Monthly salary</FormLabel>
                <FormControl>
                  <MoneyInput placeholder="0" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Phone <span className="font-normal text-muted-foreground">(optional)</span>
              </FormLabel>
              <FormControl>
                <Input type="tel" inputMode="tel" placeholder="01XXXXXXXXX" {...field} />
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
            {staff ? "Save" : "Add staff"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

/** Pay a salary: a shared expense for the month, split between members. */
function PayStaffDialog({ staff, month, onClose }: { staff: Staff; month: Month; onClose: () => void }) {
  const mess = useCurrentMess();
  const [payStaff, { isLoading }] = usePayStaffMutation();
  const [amount, setAmount] = useState(staff.monthlySalary);
  const [splitType, setSplitType] = useState<SplitType>("EQUAL");
  const [error, setError] = useState<string>();
  const [alreadyPaid, setAlreadyPaid] = useState(staff.paidThisMonth);
  const today = todayIn(mess.timezone);
  const billDate = today > month.endDate ? month.endDate : today;

  const submit = async () => {
    if (!isMoney(amount) || Number(amount) <= 0) return setError("Enter the amount");
    const res = await payStaff({
      messId: mess.id,
      staffId: staff.id,
      amount,
      billDate,
      splitType,
      paidFrom: "MESS_FUND",
      again: alreadyPaid,
    });
    if (res.error) {
      if (getErrorCode(res.error) === "SALARY_ALREADY_PAID") setAlreadyPaid(true);
      return setError(getErrorMessage(res.error));
    }
    toast.success(`${staff.name}'s salary recorded`, {
      description: "It's split between members as a shared cost.",
    });
    onClose();
  };

  return (
    <ResponsiveDialog
      open
      onOpenChange={(o) => !o && onClose()}
      title={`Pay ${staff.name}`}
      description={`Salary for ${monthLabel(month)}, paid from the mess fund.`}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} loading={isLoading}>
            {alreadyPaid ? "Pay again" : "Record salary"}
          </Button>
        </>
      }
    >
      <div className="grid gap-4">
        {alreadyPaid && (
          <Alert variant="warning">
            <CircleAlert />
            <AlertDescription className="text-current/80">
              {staff.name} was already paid this month. Pay again only for an advance or a bonus.
            </AlertDescription>
          </Alert>
        )}
        <div className="grid gap-2">
          <Label htmlFor="salary-amount">Amount</Label>
          <MoneyInput id="salary-amount" value={amount} onChange={setAmount} />
        </div>
        <div className="grid gap-2">
          <Label>Split</Label>
          <RadioGroup
            value={splitType}
            onValueChange={(v) => setSplitType(v as SplitType)}
            className="grid grid-cols-2 gap-2"
          >
            <RadioCard value="EQUAL" title={SPLIT_LABELS.EQUAL} className="p-3" />
            <RadioCard value="BY_MEAL" title={SPLIT_LABELS.BY_MEAL} className="p-3" />
          </RadioGroup>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    </ResponsiveDialog>
  );
}
