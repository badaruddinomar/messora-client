"use client";

import { useState, type ReactNode } from "react";
import { useFieldArray, useForm, useWatch, type Control } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CircleAlert, HandCoins, Plus, Trash2, Wallet } from "lucide-react";
import { toast } from "sonner";
import { DatePicker } from "@/components/common/date-picker";
import { MoneyInput } from "@/components/common/money-input";
import { MoneyText } from "@/components/common/money-text";
import { ResponsiveDialog } from "@/components/common/responsive-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioCard, RadioGroup } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useMembersQuery } from "@/features/members/members-api";
import { useCurrentMess, useMessPermissions } from "@/features/messes/mess-context";
import { applyFieldErrors, getErrorMessage, type RequestError } from "@/lib/api-error";
import { todayIn } from "@/lib/date";
import { sumMoney } from "@/lib/money";
import { useCreateBazarMutation, useUpdateBazarMutation } from "../bazars-api";
import { bazarFormSchema, emptyItem, isBlankRow, type BazarFormValues } from "../bazars-schemas";
import type { Bazar, BazarInput } from "../bazars-types";
import { ReceiptField, type ReceiptState } from "./receipt-field";

const UNITS = ["kg", "g", "L", "ml", "pcs", "dozen", "packet", "bundle"];

interface BazarFormDialogProps {
  /** Edit this bazar; omit to add a new one. */
  bazar?: Bazar;
  trigger: (open: () => void) => ReactNode;
}

export function BazarFormDialog({ bazar, trigger }: BazarFormDialogProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      {trigger(() => setOpen(true))}
      <ResponsiveDialog
        open={open}
        onOpenChange={setOpen}
        title={bazar ? "Edit bazar" : "Add bazar"}
        description={
          bazar?.status === "REJECTED"
            ? "Fix it and save to send it for approval again."
            : "What was bought, and who paid. A photo of the receipt helps the manager approve it."
        }
        className="max-h-[90svh] overflow-y-auto sm:max-w-xl"
      >
        {open && <BazarForm bazar={bazar} onDone={() => setOpen(false)} />}
      </ResponsiveDialog>
    </>
  );
}

function BazarForm({ bazar, onDone }: { bazar?: Bazar; onDone: () => void }) {
  const mess = useCurrentMess();
  const { canManage } = useMessPermissions();
  const today = todayIn(mess.timezone);
  const { data: members } = useMembersQuery({ messId: mess.id }, { skip: !canManage });
  const [createBazar, { isLoading: creating }] = useCreateBazarMutation();
  const [updateBazar, { isLoading: updating }] = useUpdateBazarMutation();
  const [formError, setFormError] = useState<RequestError>();
  const [receipt, setReceipt] = useState<ReceiptState>({
    previewUrl: bazar?.receiptUrl ?? null,
    uploading: false,
  });

  const form = useForm<BazarFormValues>({
    resolver: zodResolver(bazarFormSchema),
    defaultValues: bazar
      ? {
          date: bazar.date,
          shopperId: bazar.shopper.id,
          paidFrom: bazar.paidFrom,
          mode: bazar.items.length > 0 ? "items" : "total",
          totalAmount: bazar.totalAmount,
          items: bazar.items.length
            ? bazar.items.map((i) => ({
                name: i.name,
                quantity: i.quantity ?? "",
                unit: i.unit ?? "",
                totalPrice: i.totalPrice,
              }))
            : [emptyItem()],
          note: bazar.note ?? "",
        }
      : {
          date: today,
          shopperId: mess.membership.id,
          paidFrom: "MESS_FUND",
          mode: "total",
          totalAmount: "",
          items: [emptyItem()],
          note: "",
        },
  });
  const mode = useWatch({ control: form.control, name: "mode" });

  const onSubmit = form.handleSubmit(async (v) => {
    setFormError(undefined);
    const items = v.mode === "items" ? v.items.filter((row) => !isBlankRow(row)) : [];
    const body: BazarInput = {
      date: v.date,
      paidFrom: v.paidFrom,
      ...(canManage && { shopperId: v.shopperId }),
      items: items.map((i) => ({
        name: i.name,
        quantity: i.quantity || null,
        unit: i.unit || null,
        totalPrice: i.totalPrice,
      })),
      ...(v.mode === "total" && { totalAmount: v.totalAmount }),
      ...(receipt.key !== undefined && { receiptKey: receipt.key }),
      note: v.note || null,
    };
    const res = bazar
      ? await updateBazar({ messId: mess.id, bazarId: bazar.id, ...body })
      : await createBazar({ messId: mess.id, ...body });
    if (res.error) {
      if (!applyFieldErrors(res.error, form.setError)) setFormError(res.error);
      return;
    }
    toast.success(
      bazar ? "Bazar updated" : res.data.status === "APPROVED" ? "Bazar added" : "Bazar sent for approval",
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

        <div className="grid gap-4 sm:grid-cols-2">
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
          {canManage && (
            <FormField
              control={form.control}
              name="shopperId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Shopper</FormLabel>
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
        </div>

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
                    className="p-3 max-sm:[&>span:first-child]:hidden"
                    value="MESS_FUND"
                    title="Mess fund"
                    description="Collected money"
                    icon={<Wallet className="size-4" />}
                  />
                  <RadioCard
                    className="p-3 max-sm:[&>span:first-child]:hidden"
                    value="OWN_POCKET"
                    title="Own pocket"
                    description="Counts as a deposit"
                    icon={<HandCoins className="size-4" />}
                  />
                </RadioGroup>
              </FormControl>
            </FormItem>
          )}
        />

        <div className="grid gap-3">
          <Tabs value={mode} onValueChange={(v) => form.setValue("mode", v as BazarFormValues["mode"])}>
            <TabsList className="w-full">
              <TabsTrigger value="total">Total only</TabsTrigger>
              <TabsTrigger value="items">List items</TabsTrigger>
            </TabsList>
          </Tabs>
          {mode === "total" ? (
            <FormField
              control={form.control}
              name="totalAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Total</FormLabel>
                  <FormControl>
                    <MoneyInput placeholder="0" className="h-12 text-lg" autoFocus={!bazar} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : (
            <ItemRows control={form.control} />
          )}
        </div>

        <div className="grid gap-2">
          <Label>Receipt</Label>
          <ReceiptField value={receipt} onChange={setReceipt} />
        </div>

        <FormField
          control={form.control}
          name="note"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Note <span className="font-normal text-muted-foreground">(optional)</span>
              </FormLabel>
              <FormControl>
                <Textarea rows={2} placeholder="From Karwan Bazar" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onDone}>
            Cancel
          </Button>
          <Button type="submit" loading={creating || updating} disabled={receipt.uploading}>
            {receipt.uploading ? "Uploading receipt…" : bazar ? "Save bazar" : "Add bazar"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

/** Item rows with a running total. Enter in a price field adds the next row. */
function ItemRows({ control }: { control: Control<BazarFormValues> }) {
  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const items = useWatch({ control, name: "items" });
  const total = sumMoney(items.map((i) => i.totalPrice));

  const addRow = () => append(emptyItem(), { shouldFocus: true, focusName: `items.${fields.length}.name` });

  return (
    <div className="grid gap-3">
      <datalist id="bazar-units">
        {UNITS.map((u) => (
          <option key={u} value={u} />
        ))}
      </datalist>
      <ul className="grid gap-3">
        {fields.map((field, index) => (
          <li
            key={field.id}
            className="grid grid-cols-[1fr_auto] gap-2 rounded-lg border bg-muted/20 p-2 sm:grid-cols-[1fr_4.5rem_4.5rem_7rem_auto] sm:border-0 sm:bg-transparent sm:p-0"
          >
            <FormField
              control={control}
              name={`items.${index}.name`}
              render={({ field }) => (
                <FormItem className="gap-1">
                  <FormLabel className="sr-only">Item {index + 1}</FormLabel>
                  <FormControl>
                    <Input placeholder="Item, e.g. Rice" {...field} />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-destructive sm:order-last"
              aria-label={`Remove item ${index + 1}`}
              disabled={fields.length === 1}
              onClick={() => remove(index)}
            >
              <Trash2 />
            </Button>
            <div className="col-span-2 grid grid-cols-[1fr_1fr_1.5fr] gap-2 sm:col-span-1 sm:contents">
              <FormField
                control={control}
                name={`items.${index}.quantity`}
                render={({ field }) => (
                  <FormItem className="gap-1">
                    <FormLabel className="sr-only">Quantity</FormLabel>
                    <FormControl>
                      <Input placeholder="Qty" inputMode="decimal" {...field} />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name={`items.${index}.unit`}
                render={({ field }) => (
                  <FormItem className="gap-1">
                    <FormLabel className="sr-only">Unit</FormLabel>
                    <FormControl>
                      <Input placeholder="Unit" list="bazar-units" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name={`items.${index}.totalPrice`}
                render={({ field }) => (
                  <FormItem className="gap-1">
                    <FormLabel className="sr-only">Price of item {index + 1}</FormLabel>
                    <FormControl>
                      <MoneyInput
                        placeholder="Price"
                        {...field}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            if (index === fields.length - 1) addRow();
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            </div>
          </li>
        ))}
      </ul>
      <FormField
        control={control}
        name="items"
        render={() => (
          <FormItem>
            <FormMessage />
          </FormItem>
        )}
      />
      <div className="flex items-center justify-between gap-3">
        <Button type="button" variant="outline" size="sm" onClick={addRow} disabled={fields.length >= 100}>
          <Plus />
          Add item
        </Button>
        <p className="text-sm text-muted-foreground">
          Total <MoneyText value={total} className="ml-1 text-base font-semibold text-foreground" />
        </p>
      </div>
      <p className="text-xs text-muted-foreground">Press Enter in the last price to add another item.</p>
    </div>
  );
}
