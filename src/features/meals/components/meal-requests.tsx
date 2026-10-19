"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CircleAlert, MessageSquarePlus, MessageSquareText } from "lucide-react";
import { toast } from "sonner";
import { DatePicker } from "@/components/common/date-picker";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { ResponsiveDialog } from "@/components/common/responsive-dialog";
import { StatusBadge } from "@/components/common/status-badge";
import { UserAvatar } from "@/components/common/user-avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useCurrentMess, useMessPermissions } from "@/features/messes/mess-context";
import { applyFieldErrors, getErrorMessage, type RequestError } from "@/lib/api-error";
import { addDays, todayIn } from "@/lib/date";
import { formatDate, formatRelative } from "@/lib/format";
import { PLANNING_DAYS } from "../hooks/use-meal-date";
import {
  useCancelMealRequestMutation,
  useCreateMealRequestMutation,
  useMealRequestsQuery,
  useMealSlotsQuery,
  useRespondToMealRequestMutation,
} from "../meals-api";
import { mealRequestSchema, type MealRequestValues } from "../meals-schemas";
import type { MealRequest } from "../meals-types";

const ANY_MEAL = "any";

/** "Fish tomorrow, please": members ask, managers answer. */
export function MealRequests() {
  const mess = useCurrentMess();
  const { canManage } = useMessPermissions();
  const [filter, setFilter] = useState<"PENDING" | "ALL">(canManage ? "PENDING" : "ALL");
  const { data, isLoading, error, refetch, isFetching } = useMealRequestsQuery({
    messId: mess.id,
    ...(filter === "PENDING" && { status: "PENDING" as const }),
  });

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <TabsList>
            <TabsTrigger value="PENDING">Pending</TabsTrigger>
            <TabsTrigger value="ALL">All</TabsTrigger>
          </TabsList>
        </Tabs>
        <NewRequestDialog />
      </div>

      {error ? (
        <ErrorState error={error} onRetry={refetch} retrying={isFetching} />
      ) : isLoading || !data ? (
        <Skeleton className="h-40 rounded-xl" />
      ) : data.items.length === 0 ? (
        <EmptyState
          icon={MessageSquareText}
          title={filter === "PENDING" ? "No pending requests" : "No requests yet"}
          description={
            canManage
              ? "When members ask for something special, it shows up here."
              : "Ask the managers for something special: a dish, a late dinner, a packed lunch."
          }
        />
      ) : (
        <Card className="py-0">
          <CardContent className="px-0">
            <ul className="divide-y">
              {data.items.map((r) => (
                <RequestRow key={r.id} request={r} />
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function RequestRow({ request }: { request: MealRequest }) {
  const mess = useCurrentMess();
  const { canManage } = useMessPermissions();
  const [respond, { isLoading: responding }] = useRespondToMealRequestMutation();
  const [cancel, { isLoading: cancelling }] = useCancelMealRequestMutation();
  const [rejecting, setRejecting] = useState(false);
  const mine = request.member.id === mess.membership.id;
  const pending = request.status === "PENDING";

  const answer = async (status: "APPROVED" | "REJECTED", response?: string) => {
    const res = await respond({ messId: mess.id, requestId: request.id, status, response: response || null });
    if (res.error) {
      toast.error(getErrorMessage(res.error));
      throw res.error;
    }
    toast.success(status === "APPROVED" ? "Request approved" : "Request turned down");
  };

  const withdraw = async () => {
    const res = await cancel({ messId: mess.id, requestId: request.id });
    if (res.error) return toast.error(getErrorMessage(res.error));
    toast.success("Request withdrawn");
  };

  return (
    <li className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-start sm:px-6">
      <UserAvatar
        name={request.member.name}
        src={request.member.avatarUrl}
        size="sm"
        className="hidden sm:flex"
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
          <span className="font-medium">{mine ? "You" : request.member.name}</span>
          <span className="text-muted-foreground">
            · {formatDate(request.date, "EEE, d MMM")}
            {request.slot && ` · ${request.slot.name}`}
          </span>
          <StatusBadge status={request.status} />
        </div>
        <p className="mt-1">{request.request}</p>
        {request.respondedBy && (
          <p className="mt-1 text-sm text-muted-foreground">
            {request.respondedBy.name}
            {request.response
              ? `: “${request.response}”`
              : ` ${request.status === "APPROVED" ? "approved" : "turned it down"}`}
          </p>
        )}
        <p className="mt-1 text-xs text-muted-foreground">{formatRelative(request.createdAt)}</p>
      </div>
      {pending && (
        <div className="flex gap-2">
          {canManage && (
            <>
              <Button variant="outline" size="sm" onClick={() => setRejecting(true)}>
                Turn down
              </Button>
              <Button size="sm" loading={responding} onClick={() => answer("APPROVED").catch(() => {})}>
                Approve
              </Button>
            </>
          )}
          {mine && !canManage && (
            <Button variant="ghost" size="sm" loading={cancelling} onClick={withdraw}>
              Withdraw
            </Button>
          )}
        </div>
      )}
      {rejecting && (
        <RejectDialog
          open={rejecting}
          onOpenChange={setRejecting}
          onConfirm={(reason) => answer("REJECTED", reason)}
        />
      )}
    </li>
  );
}

function RejectDialog({
  open,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => Promise<void>;
}) {
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState(false);

  const submit = async () => {
    setPending(true);
    try {
      await onConfirm(reason.trim());
      onOpenChange(false);
    } catch {
      // The toast explains it; stay open.
    } finally {
      setPending(false);
    }
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Turn down this request?"
      description="They'll get a notification with your reply."
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={submit} loading={pending}>
            Turn down
          </Button>
        </>
      }
    >
      <Input
        aria-label="Reply (optional)"
        placeholder="Reply (optional), e.g. No fish in the market today"
        value={reason}
        maxLength={300}
        onChange={(e) => setReason(e.target.value)}
      />
    </ResponsiveDialog>
  );
}

function NewRequestDialog() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <MessageSquarePlus />
        New request
      </Button>
      <ResponsiveDialog
        open={open}
        onOpenChange={setOpen}
        title="Ask the managers"
        description="For a dish, a late meal, a packed lunch… They'll get a notification."
      >
        {open && <NewRequestForm onDone={() => setOpen(false)} />}
      </ResponsiveDialog>
    </>
  );
}

function NewRequestForm({ onDone }: { onDone: () => void }) {
  const mess = useCurrentMess();
  const today = todayIn(mess.timezone);
  const maxDate = addDays(today, PLANNING_DAYS);
  const { data: slots } = useMealSlotsQuery(mess.id);
  const [createRequest, { isLoading }] = useCreateMealRequestMutation();
  const [formError, setFormError] = useState<RequestError>();

  const form = useForm<MealRequestValues>({
    resolver: zodResolver(mealRequestSchema),
    defaultValues: { date: addDays(today, 1), slotId: ANY_MEAL, request: "" },
  });

  const onSubmit = form.handleSubmit(async ({ date, slotId, request }) => {
    setFormError(undefined);
    const res = await createRequest({
      messId: mess.id,
      date,
      slotId: slotId === ANY_MEAL ? null : slotId,
      request,
    });
    if (res.error) {
      if (!applyFieldErrors(res.error, form.setError)) setFormError(res.error);
      return;
    }
    toast.success("Request sent to the managers");
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
                    isDisabledDay={(day) => {
                      const d = format(day, "yyyy-MM-dd");
                      return d < today || d > maxDate;
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="slotId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Meal</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={ANY_MEAL}>Any meal</SelectItem>
                    {slots
                      ?.filter((s) => s.isActive)
                      .map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="request"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Your request</FormLabel>
              <FormControl>
                <Textarea rows={3} placeholder="Could we have fish curry?" autoFocus {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onDone}>
            Cancel
          </Button>
          <Button type="submit" loading={isLoading}>
            Send request
          </Button>
        </div>
      </form>
    </Form>
  );
}
