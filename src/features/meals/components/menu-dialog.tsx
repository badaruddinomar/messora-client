"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CircleAlert, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { ResponsiveDialog } from "@/components/common/responsive-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useCurrentMess } from "@/features/messes/mess-context";
import { applyFieldErrors, getErrorMessage, type RequestError } from "@/lib/api-error";
import { formatDate } from "@/lib/format";
import { useDeleteMenuMutation, useSaveMenuMutation } from "../meals-api";
import { menuSchema, type MenuValues } from "../meals-schemas";
import type { DaySlot } from "../meals-types";

/** Managers post what's cooking for a meal. A new menu notifies everyone; edits don't. */
export function MenuDialog({ slot, date }: { slot: DaySlot; date: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="ghost" size="sm" className="-my-1 h-7 px-2 text-xs" onClick={() => setOpen(true)}>
        {slot.menu ? <Pencil /> : <Plus />}
        {slot.menu ? "Edit" : "Add menu"}
      </Button>
      <ResponsiveDialog
        open={open}
        onOpenChange={setOpen}
        title={`${slot.name} menu`}
        description={`For ${formatDate(date, "EEEE, d MMM")}.${slot.menu ? "" : " Everyone gets a notification."}`}
      >
        {open && <MenuForm slot={slot} date={date} onDone={() => setOpen(false)} />}
      </ResponsiveDialog>
    </>
  );
}

function MenuForm({ slot, date, onDone }: { slot: DaySlot; date: string; onDone: () => void }) {
  const mess = useCurrentMess();
  const [saveMenu, { isLoading }] = useSaveMenuMutation();
  const [deleteMenu, { isLoading: deleting }] = useDeleteMenuMutation();
  const [formError, setFormError] = useState<RequestError>();

  const form = useForm<MenuValues>({
    resolver: zodResolver(menuSchema),
    defaultValues: { items: slot.menu?.items ?? "", note: slot.menu?.note ?? "" },
  });

  const onSubmit = form.handleSubmit(async ({ items, note }) => {
    setFormError(undefined);
    const res = await saveMenu({ messId: mess.id, date, slotId: slot.id, items, note: note || null });
    if (res.error) {
      if (!applyFieldErrors(res.error, form.setError)) setFormError(res.error);
      return;
    }
    toast.success(slot.menu ? "Menu updated" : "Menu posted");
    onDone();
  });

  const onDelete = async () => {
    if (!slot.menu) return;
    const res = await deleteMenu({ messId: mess.id, menuId: slot.menu.id, date });
    if (res.error) return setFormError(res.error);
    toast.success("Menu removed");
    onDone();
  };

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
          name="items"
          render={({ field }) => (
            <FormItem>
              <FormLabel>What&apos;s cooking</FormLabel>
              <FormControl>
                <Input placeholder="Rice, dal, chicken curry" autoFocus {...field} />
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
                <Input placeholder="Served at 2 PM" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          {slot.menu && (
            <Button
              type="button"
              variant="ghost"
              className="sm:mr-auto"
              onClick={onDelete}
              loading={deleting}
            >
              Remove menu
            </Button>
          )}
          <Button type="button" variant="outline" onClick={onDone}>
            Cancel
          </Button>
          <Button type="submit" loading={isLoading}>
            {slot.menu ? "Save menu" : "Post menu"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
