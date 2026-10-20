"use client";

import { useState, type ReactNode } from "react";
import { useForm, useWatch, type Control, type UseFormSetValue } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CircleAlert, HandCoins, Info, Wallet } from "lucide-react";
import { toast } from "sonner";
import { DatePicker } from "@/components/common/date-picker";
import { MoneyInput } from "@/components/common/money-input";
import { MoneyText } from "@/components/common/money-text";
import { ResponsiveDialog } from "@/components/common/responsive-dialog";
import { UserAvatar } from "@/components/common/user-avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioCard, RadioGroup } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ReceiptField, type ReceiptState } from "@/features/bazars/components/receipt-field";
import { useMembersQuery } from "@/features/members/members-api";
import { useCurrentMess } from "@/features/messes/mess-context";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { applyFieldErrors, getErrorMessage, type RequestError } from "@/lib/api-error";
import { cn } from "@/lib/cn";
import { todayIn } from "@/lib/date";
import { formatCount } from "@/lib/format";
import { isMoney, subtractMoney, sumMoney } from "@/lib/money";
import { useCreateExpenseMutation, useSplitPreviewQuery, useUpdateExpenseMutation } from "../expenses-api";
import { expenseFormSchema, type ExpenseFormValues } from "../expenses-schemas";
import {
  CATEGORY_LABELS,
  SPLIT_LABELS,
  type ExpenseCategory,
  type ExpenseDetail,
  type ExpenseInput,
  type SplitType,
} from "../expenses-types";

const SPLIT_HELP: Record<SplitType, string> = {
  EQUAL: "Everyone in the mess this month pays the same.",
  BY_MEAL: "Each member pays in proportion to their meals.",
  CUSTOM: "You set each member's share.",
};

interface ExpenseFormDialogProps {
  expense?: ExpenseDetail;
  trigger: (open: () => void) => ReactNode;
}

/** Add or edit a shared cost (managers), with a live preview of who pays what. */
export function ExpenseFormDialog({ expense, trigger }: ExpenseFormDialogProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      {trigger(() => setOpen(true))}
      <ResponsiveDialog
        open={open}
        onOpenChange={setOpen}
        title={expense ? "Edit expense" : "Add an expense"}
        description="A shared cost like a bill, rent or a salary, split between members."
        className="max-h-[90svh] overflow-y-auto sm:max-w-xl"
      >
        {open && <ExpenseForm expense={expense} onDone={() => setOpen(false)} />}
      </ResponsiveDialog>
    </>
  );
}

function ExpenseForm({ expense, onDone }: { expense?: ExpenseDetail; onDone: () => void }) {
  const mess = useCurrentMess();
  const today = todayIn(mess.timezone);
  const { data: members } = useMembersQuery({ messId: mess.id });
  const [createExpense, { isLoading: creating }] = useCreateExpenseMutation();
  const [updateExpense, { isLoading: updating }] = useUpdateExpenseMutation();
  const [formError, setFormError] = useState<RequestError>();
  const [receipt, setReceipt] = useState<ReceiptState>({
    previewUrl: expense?.receiptUrl ?? null,
    uploading: false,
  });
  // The title follows the category until someone types their own.
  const [titleTouched, setTitleTouched] = useState(!!expense);

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      category: expense?.category ?? "ELECTRICITY",
      title: expense?.title ?? `${CATEGORY_LABELS.ELECTRICITY} bill`,
      amount: expense?.amount ?? "",
      billDate: expense?.billDate ?? today,
      splitType: expense?.splitType ?? "EQUAL",
      paidFrom: expense?.paidFrom ?? "MESS_FUND",
      paidByMemberId: expense?.paidBy?.id ?? "",
      shares:
        expense?.splitType === "CUSTOM"
          ? Object.fromEntries(expense.shares.map((s) => [s.member.id, s.amount]))
          : {},
    },
  });
  const [splitType, paidFrom] = useWatch({ control: form.control, name: ["splitType", "paidFrom"] });

  const onSubmit = form.handleSubmit(async (v) => {
    setFormError(undefined);
    const body: ExpenseInput = {
      category: v.category,
      title: v.title,
      amount: v.amount,
      splitType: v.splitType,
      paidFrom: v.paidFrom,
      paidByMemberId: v.paidFrom === "OWN_POCKET" ? v.paidByMemberId : null,
      billDate: v.billDate,
      ...(receipt.key !== undefined && { receiptKey: receipt.key }),
      ...(v.splitType === "CUSTOM" && {
        shares: Object.entries(v.shares)
          .filter(([, amount]) => isMoney(amount) && Number(amount) > 0)
          .map(([memberId, amount]) => ({ memberId, amount })),
      }),
    };
    const res = expense
      ? await updateExpense({ messId: mess.id, expenseId: expense.id, ...body })
      : await createExpense({ messId: mess.id, ...body });
    if (res.error) {
      if (!applyFieldErrors(res.error, form.setError)) setFormError(res.error);
      return;
    }
    toast.success(expense ? "Expense updated" : "Expense added");
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

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={(v) => {
                    field.onChange(v);
                    if (!titleTouched) {
                      const label = CATEGORY_LABELS[v as ExpenseCategory];
                      form.setValue(
                        "title",
                        ["ELECTRICITY", "GAS", "WATER", "INTERNET"].includes(v) ? `${label} bill` : label,
                      );
                    }
                  }}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
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
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    onChange={(e) => {
                      setTitleTouched(true);
                      field.onChange(e);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount</FormLabel>
                <FormControl>
                  <MoneyInput placeholder="0" className="text-lg" autoFocus={!expense} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="billDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bill date</FormLabel>
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
        </div>

        <FormField
          control={form.control}
          name="splitType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Split</FormLabel>
              <FormControl>
                <RadioGroup
                  value={field.value}
                  onValueChange={field.onChange}
                  className="grid grid-cols-3 gap-2"
                >
                  {(Object.keys(SPLIT_LABELS) as SplitType[]).map((t) => (
                    <RadioCard key={t} value={t} title={SPLIT_LABELS[t]} className="items-center p-3" />
                  ))}
                </RadioGroup>
              </FormControl>
              <p className="text-xs text-muted-foreground">{SPLIT_HELP[splitType]}</p>
            </FormItem>
          )}
        />

        {splitType === "CUSTOM" ? (
          <CustomShares control={form.control} setValue={form.setValue} members={members ?? []} />
        ) : (
          <SplitPreviewPanel control={form.control} />
        )}

        <FormField
          control={form.control}
          name="paidFrom"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Paid from</FormLabel>
              <FormControl>
                <RadioGroup
                  value={field.value}
                  onValueChange={field.onChange}
                  className="grid grid-cols-2 gap-3"
                >
                  <RadioCard
                    value="MESS_FUND"
                    title="Mess fund"
                    description="Collected money"
                    icon={<Wallet className="size-4" />}
                    className="p-3 max-sm:[&>span:first-child]:hidden"
                  />
                  <RadioCard
                    value="OWN_POCKET"
                    title="A member"
                    description="Counts as their deposit"
                    icon={<HandCoins className="size-4" />}
                    className="p-3 max-sm:[&>span:first-child]:hidden"
                  />
                </RadioGroup>
              </FormControl>
            </FormItem>
          )}
        />
        {paidFrom === "OWN_POCKET" && (
          <FormField
            control={form.control}
            name="paidByMemberId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Who paid</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Pick a member" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {members?.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.id === mess.membership.id ? "Me" : m.user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="grid gap-2">
          <Label>Receipt</Label>
          <ReceiptField value={receipt} onChange={setReceipt} />
        </div>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onDone}>
            Cancel
          </Button>
          <Button type="submit" loading={creating || updating} disabled={receipt.uploading}>
            {expense ? "Save expense" : "Add expense"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

/** Who pays what for an EQUAL or BY_MEAL split, from the server, as the amount is typed. */
function SplitPreviewPanel({ control }: { control: Control<ExpenseFormValues> }) {
  const mess = useCurrentMess();
  const [amount, billDate, splitType] = useWatch({ control, name: ["amount", "billDate", "splitType"] });
  const debouncedAmount = useDebouncedValue(amount);
  const ready =
    isMoney(debouncedAmount) && Number(debouncedAmount) > 0 && !!billDate && splitType !== "CUSTOM";
  const { data, isFetching } = useSplitPreviewQuery(
    {
      messId: mess.id,
      billDate,
      amount: debouncedAmount,
      splitType: splitType === "BY_MEAL" ? "BY_MEAL" : "EQUAL",
    },
    { skip: !ready },
  );

  if (!ready) {
    return (
      <p className="rounded-lg border border-dashed px-3 py-4 text-center text-sm text-muted-foreground">
        Enter the amount to see who pays what.
      </p>
    );
  }
  return (
    <div
      className={cn(
        "grid gap-2 rounded-lg border bg-muted/20 p-3 transition-opacity",
        isFetching && "opacity-60",
      )}
    >
      <p className="text-xs font-medium text-muted-foreground">Who pays what</p>
      {data?.fellBackToEqual && (
        <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
          <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          No meals recorded yet, so it&apos;s split equally for now. It follows the meals as they&apos;re
          added.
        </p>
      )}
      {!data ? (
        <Skeleton className="h-16" />
      ) : (
        <ul className="grid gap-1.5">
          {data.shares.map((s) => (
            <li key={s.member.id} className="flex items-center gap-2 text-sm">
              <UserAvatar name={s.member.name} src={s.member.avatarUrl} size="sm" className="size-6" />
              <span className="min-w-0 flex-1 truncate">{s.member.name}</span>
              {splitType === "BY_MEAL" && (
                <span className="tabular text-xs text-muted-foreground">
                  {formatCount(s.weightedMeals)} meals
                </span>
              )}
              <MoneyText value={s.amount} className="w-24 text-right font-medium" />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CustomShares({
  control,
  setValue,
  members,
}: {
  control: Control<ExpenseFormValues>;
  setValue: UseFormSetValue<ExpenseFormValues>;
  members: { id: string; user: { name: string; avatarUrl: string | null } }[];
}) {
  const [amount, shares] = useWatch({ control, name: ["amount", "shares"] });
  const assigned = sumMoney(Object.values(shares));
  const remaining = isMoney(amount) ? subtractMoney(amount, assigned) : null;

  return (
    <div className="grid gap-2 rounded-lg border bg-muted/20 p-3">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-muted-foreground">Each member&apos;s share</span>
        {remaining !== null && (
          <span
            className={cn(
              "tabular",
              Number(remaining) === 0 ? "text-success" : "text-warning-foreground dark:text-warning",
            )}
          >
            {Number(remaining) === 0
              ? "Adds up"
              : `${Number(remaining) > 0 ? "Left" : "Over by"} ৳${remaining.replace("-", "")}`}
          </span>
        )}
      </div>
      <ul className="grid gap-2">
        {members.map((m) => (
          <li key={m.id} className="flex items-center gap-2">
            <UserAvatar name={m.user.name} src={m.user.avatarUrl} size="sm" className="size-6" />
            <Label htmlFor={`share-${m.id}`} className="min-w-0 flex-1 truncate font-normal">
              {m.user.name}
            </Label>
            <div className="w-32">
              <MoneyInput
                id={`share-${m.id}`}
                placeholder="0"
                value={shares[m.id] ?? ""}
                onChange={(v) => setValue(`shares.${m.id}`, v, { shouldValidate: false })}
              />
            </div>
          </li>
        ))}
      </ul>
      <FormField
        control={control}
        name="shares"
        render={() => (
          <FormItem>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
