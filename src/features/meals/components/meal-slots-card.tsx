"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CircleAlert, Clock, MoreHorizontal, Plus } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { ErrorState } from "@/components/common/error-state";
import { ResponsiveDialog } from "@/components/common/responsive-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentMess } from "@/features/messes/mess-context";
import { MEAL_WEIGHTS, mealSlotSchema } from "@/features/messes/messes-schemas";
import { applyFieldErrors, getErrorMessage, type RequestError } from "@/lib/api-error";
import type { z } from "zod";
import {
  useCreateMealSlotMutation,
  useDeleteMealSlotMutation,
  useMealSlotsQuery,
  useUpdateMealSlotMutation,
} from "../meals-api";
import type { MealSlot } from "../meals-types";
import { formatTimeOfDay, formatWeight } from "../utils";

type SlotValues = z.infer<typeof mealSlotSchema>;

const MAX_SLOTS = 6;

/** The meals a mess serves, their weight and cutoff (admins edit; BUSINESS_RULES §4). */
export function MealSlotsCard({ readOnly }: { readOnly: boolean }) {
  const mess = useCurrentMess();
  const { data: slots, isLoading, error, refetch, isFetching } = useMealSlotsQuery(mess.id);
  const [editing, setEditing] = useState<MealSlot | "new" | null>(null);
  const active = slots?.filter((s) => s.isActive) ?? [];
  const archived = slots?.filter((s) => !s.isActive) ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Meals</CardTitle>
        <CardDescription>
          The weight is how much a meal counts toward the bill. Members change a meal until its cutoff.
        </CardDescription>
        {!readOnly && (
          <CardAction>
            <Button
              variant="outline"
              size="sm"
              disabled={active.length >= MAX_SLOTS}
              onClick={() => setEditing("new")}
            >
              <Plus />
              Add meal
            </Button>
          </CardAction>
        )}
      </CardHeader>
      <CardContent>
        {error ? (
          <ErrorState error={error} onRetry={refetch} retrying={isFetching} />
        ) : isLoading || !slots ? (
          <Skeleton className="h-32 rounded-lg" />
        ) : (
          <ul className="divide-y">
            {[...active, ...archived].map((slot) => (
              <SlotRow
                key={slot.id}
                slot={slot}
                readOnly={readOnly}
                isLastActive={slot.isActive && active.length === 1}
                onEdit={() => setEditing(slot)}
              />
            ))}
          </ul>
        )}
      </CardContent>
      <ResponsiveDialog
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
        title={editing === "new" ? "Add a meal" : "Edit meal"}
        description="Changes apply to upcoming days; past months keep their numbers."
      >
        {editing !== null && (
          <SlotForm slot={editing === "new" ? null : editing} onDone={() => setEditing(null)} />
        )}
      </ResponsiveDialog>
    </Card>
  );
}

function SlotRow({
  slot,
  readOnly,
  isLastActive,
  onEdit,
}: {
  slot: MealSlot;
  readOnly: boolean;
  isLastActive: boolean;
  onEdit: () => void;
}) {
  const mess = useCurrentMess();
  const [updateSlot] = useUpdateMealSlotMutation();
  const [deleteSlot] = useDeleteMealSlotMutation();
  const [confirming, setConfirming] = useState(false);

  const restore = async () => {
    const res = await updateSlot({ messId: mess.id, slotId: slot.id, isActive: true });
    if (res.error) return toast.error(getErrorMessage(res.error));
    toast.success(`${slot.name} is back`);
  };

  const remove = async () => {
    const res = await deleteSlot({ messId: mess.id, slotId: slot.id });
    if (res.error) {
      toast.error(getErrorMessage(res.error));
      throw res.error;
    }
    toast.success(res.data.archived ? `${slot.name} archived` : `${slot.name} removed`);
  };

  return (
    <li className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className={slot.isActive ? "font-medium" : "font-medium text-muted-foreground"}>{slot.name}</p>
          <Badge variant="muted" className="tabular">
            {formatWeight(slot.weight)}
          </Badge>
          {!slot.isActive && <Badge variant="outline">Archived</Badge>}
        </div>
        <p className="flex items-center gap-1 text-sm text-muted-foreground">
          <Clock className="size-3.5" aria-hidden />
          {slot.cutoffTime ? `Cutoff ${formatTimeOfDay(slot.cutoffTime)}` : "Locks at the start of the day"}
        </p>
      </div>
      {!readOnly &&
        (slot.isActive ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label={`Options for ${slot.name}`}>
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={onEdit}>Edit</DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                disabled={isLastActive}
                onSelect={() => setConfirming(true)}
              >
                Remove
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button variant="ghost" size="sm" onClick={restore}>
            Restore
          </Button>
        ))}
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={`Remove ${slot.name}?`}
        description="Upcoming meals for it are removed. If it was already eaten, it's archived so past bills stay the same."
        confirmLabel={`Remove ${slot.name}`}
        destructive
        onConfirm={remove}
      />
    </li>
  );
}

function SlotForm({ slot, onDone }: { slot: MealSlot | null; onDone: () => void }) {
  const mess = useCurrentMess();
  const [createSlot, { isLoading: creating }] = useCreateMealSlotMutation();
  const [updateSlot, { isLoading: updating }] = useUpdateMealSlotMutation();
  const [formError, setFormError] = useState<RequestError>();

  const weight = slot ? String(Number(slot.weight)) : "1";
  const form = useForm<SlotValues>({
    resolver: zodResolver(mealSlotSchema),
    defaultValues: {
      name: slot?.name ?? "",
      weight: (MEAL_WEIGHTS as readonly string[]).includes(weight) ? (weight as SlotValues["weight"]) : "1",
      cutoffTime: slot?.cutoffTime ?? "",
    },
  });

  const onSubmit = form.handleSubmit(async ({ name, weight, cutoffTime }) => {
    setFormError(undefined);
    const body = { name, weight: Number(weight), cutoffTime: cutoffTime || null };
    const res = slot
      ? await updateSlot({ messId: mess.id, slotId: slot.id, ...body })
      : await createSlot({ messId: mess.id, ...body });
    if (res.error) {
      if (!applyFieldErrors(res.error, form.setError)) setFormError(res.error);
      return;
    }
    toast.success(slot ? "Meal updated" : "Meal added");
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
                <Input placeholder="Lunch" autoFocus {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="weight"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Counts as</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {MEAL_WEIGHTS.map((w) => (
                      <SelectItem key={w} value={w}>
                        {w} {w === "1" ? "meal" : "meals"}
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
            name="cutoffTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Cutoff <span className="font-normal text-muted-foreground">(optional)</span>
                </FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormDescription>Leave empty to lock it when the day starts.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onDone}>
            Cancel
          </Button>
          <Button type="submit" loading={creating || updating}>
            {slot ? "Save meal" : "Add meal"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
