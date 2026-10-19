"use client";

import { useState, type ReactNode } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CircleAlert } from "lucide-react";
import { toast } from "sonner";
import { DatePicker } from "@/components/common/date-picker";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useMembersQuery } from "@/features/members/members-api";
import { useCurrentMess, useMessPermissions } from "@/features/messes/mess-context";
import { applyFieldErrors, getErrorMessage, type RequestError } from "@/lib/api-error";
import { addDays, todayIn } from "@/lib/date";
import { useCreateMealOffMutation } from "../meals-api";
import { mealOffSchema, type MealOffValues } from "../meals-schemas";

const ME = "me";

/** Turn meals off for a few days (going home, exams…). Managers can do it for anyone. */
export function MealOffDialog({ trigger }: { trigger: (open: () => void) => ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      {trigger(() => setOpen(true))}
      <ResponsiveDialog
        open={open}
        onOpenChange={setOpen}
        title="Meal off"
        description="Meals in these days are turned off, including ones added later."
      >
        {open && <MealOffForm onDone={() => setOpen(false)} />}
      </ResponsiveDialog>
    </>
  );
}

function MealOffForm({ onDone }: { onDone: () => void }) {
  const mess = useCurrentMess();
  const { canManage } = useMessPermissions();
  const { data: members } = useMembersQuery({ messId: mess.id }, { skip: !canManage });
  const [createMealOff, { isLoading }] = useCreateMealOffMutation();
  const [formError, setFormError] = useState<RequestError>();
  const today = todayIn(mess.timezone);

  const form = useForm<MealOffValues>({
    resolver: zodResolver(mealOffSchema),
    defaultValues: { memberId: ME, fromDate: addDays(today, 1), toDate: addDays(today, 1), reason: "" },
  });
  const fromDate = useWatch({ control: form.control, name: "fromDate" });

  const onSubmit = form.handleSubmit(async ({ memberId, fromDate, toDate, reason }) => {
    setFormError(undefined);
    const res = await createMealOff({
      messId: mess.id,
      ...(memberId && memberId !== ME && { memberId }),
      fromDate,
      toDate,
      reason: reason || null,
    });
    if (res.error) {
      if (!applyFieldErrors(res.error, form.setError)) setFormError(res.error);
      return;
    }
    toast.success("Meals turned off for those days");
    onDone();
  });

  // Members plan from today on; managers can also cover earlier days.
  const beforeToday = (day: Date) => !canManage && format(day, "yyyy-MM-dd") < today;

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="grid gap-5" noValidate>
        {formError && (
          <Alert variant="destructive">
            <CircleAlert />
            <AlertDescription>{getErrorMessage(formError)}</AlertDescription>
          </Alert>
        )}

        {canManage && (
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
                    <SelectItem value={ME}>Me</SelectItem>
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

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="fromDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First day</FormLabel>
                <FormControl>
                  <DatePicker
                    value={field.value}
                    onChange={(v) => {
                      field.onChange(v ?? "");
                      if (v && v > form.getValues("toDate")) form.setValue("toDate", v);
                    }}
                    isDisabledDay={beforeToday}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="toDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last day</FormLabel>
                <FormControl>
                  <DatePicker
                    value={field.value}
                    onChange={(v) => field.onChange(v ?? "")}
                    isDisabledDay={(day) => beforeToday(day) || format(day, "yyyy-MM-dd") < fromDate}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="reason"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Reason <span className="font-normal text-muted-foreground">(optional)</span>
              </FormLabel>
              <FormControl>
                <Textarea rows={2} placeholder="Going home for Eid" {...field} />
              </FormControl>
              <FormDescription>Meals that are past their cutoff today stay as they are.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onDone}>
            Cancel
          </Button>
          <Button type="submit" loading={isLoading}>
            Turn meals off
          </Button>
        </div>
      </form>
    </Form>
  );
}
