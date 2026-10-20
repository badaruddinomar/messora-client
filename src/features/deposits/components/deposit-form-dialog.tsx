"use client";

import { useState, type ReactNode } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CircleAlert } from "lucide-react";
import { toast } from "sonner";
import { DatePicker } from "@/components/common/date-picker";
import { MoneyInput } from "@/components/common/money-input";
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
import { RadioCard, RadioGroup } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useMembersQuery } from "@/features/members/members-api";
import { useCurrentMess, useMessPermissions } from "@/features/messes/mess-context";
import { applyFieldErrors, getErrorMessage, type RequestError } from "@/lib/api-error";
import { todayIn } from "@/lib/date";
import { useCreateDepositMutation, useUpdateDepositMutation } from "../deposits-api";
import { depositFormSchema, type DepositFormValues } from "../deposits-schemas";
import { PAYMENT_METHODS, type Deposit, type DepositInput } from "../deposits-types";

interface DepositFormDialogProps {
  /** Edit this deposit; omit to add a new one. */
  deposit?: Deposit;
  trigger: (open: () => void) => ReactNode;
}

export function DepositFormDialog({ deposit, trigger }: DepositFormDialogProps) {
  const { canManage } = useMessPermissions();
  const [open, setOpen] = useState(false);
  return (
    <>
      {trigger(() => setOpen(true))}
      <ResponsiveDialog
        open={open}
        onOpenChange={setOpen}
        title={deposit ? "Edit deposit" : canManage ? "Record a deposit" : "Add a deposit"}
        description={
          deposit?.status === "REJECTED"
            ? "Fix it and save to send it for confirmation again."
            : canManage
              ? "Money a member paid into the mess."
              : "Money you paid the manager. They confirm it once it arrives."
        }
        className="max-h-[90svh] overflow-y-auto sm:max-w-lg"
      >
        {open && <DepositForm deposit={deposit} onDone={() => setOpen(false)} />}
      </ResponsiveDialog>
    </>
  );
}

function DepositForm({ deposit, onDone }: { deposit?: Deposit; onDone: () => void }) {
  const mess = useCurrentMess();
  const { canManage } = useMessPermissions();
  const today = todayIn(mess.timezone);
  const { data: members } = useMembersQuery({ messId: mess.id }, { skip: !canManage || !!deposit });
  const [createDeposit, { isLoading: creating }] = useCreateDepositMutation();
  const [updateDeposit, { isLoading: updating }] = useUpdateDepositMutation();
  const [formError, setFormError] = useState<RequestError>();

  const form = useForm<DepositFormValues>({
    resolver: zodResolver(depositFormSchema),
    defaultValues: {
      date: deposit?.date ?? today,
      memberId: deposit?.member.id ?? mess.membership.id,
      amount: deposit?.amount ?? "",
      method: deposit?.method ?? "CASH",
      transactionRef: deposit?.transactionRef ?? "",
      note: deposit?.note ?? "",
    },
  });
  const method = useWatch({ control: form.control, name: "method" });

  const onSubmit = form.handleSubmit(async (v) => {
    setFormError(undefined);
    const body: DepositInput = {
      date: v.date,
      amount: v.amount,
      method: v.method,
      transactionRef: v.method === "CASH" ? null : v.transactionRef || null,
      note: v.note || null,
      ...(!deposit && canManage && { memberId: v.memberId }),
    };
    const res = deposit
      ? await updateDeposit({ messId: mess.id, depositId: deposit.id, ...body })
      : await createDeposit({ messId: mess.id, ...body });
    if (res.error) {
      if (!applyFieldErrors(res.error, form.setError)) setFormError(res.error);
      return;
    }
    toast.success(
      deposit
        ? "Deposit updated"
        : res.data.status === "APPROVED"
          ? "Deposit recorded"
          : "Deposit sent for confirmation",
    );
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

        {canManage && !deposit && (
          <FormField
            control={form.control}
            name="memberId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Member</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={mess.membership.id}>Me</SelectItem>
                    {members
                      ?.filter((m) => m.id !== mess.membership.id)
                      .map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.user.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
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
                <MoneyInput placeholder="0" className="h-12 text-lg" autoFocus={!deposit} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="method"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Paid by</FormLabel>
              <FormControl>
                <RadioGroup
                  value={field.value}
                  onValueChange={field.onChange}
                  className="grid grid-cols-3 gap-2"
                >
                  {PAYMENT_METHODS.map((m) => (
                    <RadioCard key={m.value} value={m.value} title={m.label} className="items-center p-3" />
                  ))}
                </RadioGroup>
              </FormControl>
            </FormItem>
          )}
        />

        {method !== "CASH" && (
          <FormField
            control={form.control}
            name="transactionRef"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Transaction ID <span className="font-normal text-muted-foreground">(optional)</span>
                </FormLabel>
                <FormControl>
                  <Input placeholder="e.g. 9AX7K2LM3Q" autoCapitalize="characters" {...field} />
                </FormControl>
                <FormDescription>Helps the manager match it in their statement.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Day</FormLabel>
              <FormControl>
                <DatePicker
                  value={field.value}
                  onChange={(v) => field.onChange(v ?? "")}
                  isDisabledDay={(day) => format(day, "yyyy-MM-dd") > today}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="note"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Note <span className="font-normal text-muted-foreground">(optional)</span>
              </FormLabel>
              <FormControl>
                <Textarea rows={2} placeholder="For October" {...field} />
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
            {deposit ? "Save deposit" : canManage ? "Record deposit" : "Add deposit"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
