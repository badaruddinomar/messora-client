"use client";

import { useState } from "react";
import { BedDouble, DoorOpen, MoreHorizontal, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { MoneyInput } from "@/components/common/money-input";
import { MoneyText } from "@/components/common/money-text";
import { PageHeader } from "@/components/common/page-header";
import { ResponsiveDialog } from "@/components/common/responsive-dialog";
import { StatCard } from "@/components/common/stat-card";
import { UserAvatar } from "@/components/common/user-avatar";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useMembersQuery } from "@/features/members/members-api";
import { useCurrentMess, useMessPermissions } from "@/features/messes/mess-context";
import { getErrorMessage } from "@/lib/api-error";
import { cn } from "@/lib/cn";
import { isMoney } from "@/lib/money";
import {
  useAssignSeatMutation,
  useCreateRoomMutation,
  useCreateSeatMutation,
  useDeleteRoomMutation,
  useDeleteSeatMutation,
  useRoomsQuery,
  useUpdateSeatMutation,
} from "../rooms-api";
import type { Room, Seat } from "../rooms-types";

type Dialog =
  { kind: "room" } | { kind: "seat"; room: Room; seat?: Seat } | { kind: "assign"; seat: Seat } | null;

/** Rooms & seats: who sleeps where and what each seat costs a month (BUSINESS_RULES §6). */
export function RoomsPage() {
  const mess = useCurrentMess();
  const { isAdmin } = useMessPermissions();
  const { data, isLoading, error, refetch, isFetching } = useRoomsQuery(mess.id);
  const [dialog, setDialog] = useState<Dialog>(null);

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Rooms & seats"
        description="Who lives where, and each seat's monthly rent. Rent is charged when a month is closed."
        actions={
          isAdmin && (
            <Button onClick={() => setDialog({ kind: "room" })}>
              <Plus />
              Add room
            </Button>
          )
        }
      />
      {error ? (
        <ErrorState error={error} onRetry={refetch} retrying={isFetching} />
      ) : isLoading || !data ? (
        <Skeleton className="h-64 rounded-xl" />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Seats" value={data.summary.seats} />
            <StatCard label="Taken" value={data.summary.occupied} />
            <StatCard label="Free" value={data.summary.vacant} />
            <StatCard
              label="Rent a month"
              value={<MoneyText value={data.summary.monthlyRent} compact />}
              helper="From taken seats"
            />
          </div>
          {data.rooms.length === 0 ? (
            <EmptyState
              icon={DoorOpen}
              title="No rooms yet"
              description={
                isAdmin
                  ? "Add your rooms and seats to charge seat rent."
                  : "An admin can set up rooms and seats."
              }
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {data.rooms.map((room) => (
                <RoomCard key={room.id} room={room} canEdit={isAdmin} onDialog={setDialog} />
              ))}
            </div>
          )}
        </>
      )}
      {dialog?.kind === "room" && <RoomDialog onClose={() => setDialog(null)} />}
      {dialog?.kind === "seat" && (
        <SeatDialog room={dialog.room} seat={dialog.seat} onClose={() => setDialog(null)} />
      )}
      {dialog?.kind === "assign" && <AssignDialog seat={dialog.seat} onClose={() => setDialog(null)} />}
    </div>
  );
}

function RoomCard({
  room,
  canEdit,
  onDialog,
}: {
  room: Room;
  canEdit: boolean;
  onDialog: (d: Dialog) => void;
}) {
  const mess = useCurrentMess();
  const [deleteRoom] = useDeleteRoomMutation();
  const [confirming, setConfirming] = useState(false);

  const remove = async () => {
    const res = await deleteRoom({ messId: mess.id, roomId: room.id });
    if (res.error) {
      toast.error(getErrorMessage(res.error));
      throw res.error;
    }
    toast.success(`${room.name} removed`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{room.name}</CardTitle>
        <CardDescription>
          {room.floor ? `${room.floor} floor · ` : ""}
          {room.seats.length === 1 ? "1 seat" : `${room.seats.length} seats`}
        </CardDescription>
        {canEdit && (
          <CardAction className="flex gap-1">
            <Button variant="outline" size="sm" onClick={() => onDialog({ kind: "seat", room })}>
              <Plus />
              Seat
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-destructive"
              aria-label={`Remove ${room.name}`}
              onClick={() => setConfirming(true)}
            >
              <Trash2 />
            </Button>
          </CardAction>
        )}
      </CardHeader>
      <CardContent>
        {room.seats.length === 0 ? (
          <p className="text-sm text-muted-foreground">No seats yet.</p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {room.seats.map((seat) => (
              <SeatTile key={seat.id} seat={seat} room={room} canEdit={canEdit} onDialog={onDialog} />
            ))}
          </ul>
        )}
      </CardContent>
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={`Remove ${room.name}?`}
        description="Its seats are removed too. Rooms with someone in them can't be removed."
        confirmLabel={`Remove ${room.name}`}
        destructive
        onConfirm={remove}
      />
    </Card>
  );
}

function SeatTile({
  seat,
  room,
  canEdit,
  onDialog,
}: {
  seat: Seat;
  room: Room;
  canEdit: boolean;
  onDialog: (d: Dialog) => void;
}) {
  const mess = useCurrentMess();
  const [assign] = useAssignSeatMutation();
  const [updateSeat] = useUpdateSeatMutation();
  const [deleteSeat] = useDeleteSeatMutation();
  const run = async (action: Promise<{ error?: unknown }>, done: string) => {
    const res = await action;
    if (res.error) return toast.error(getErrorMessage(res.error as Parameters<typeof getErrorMessage>[0]));
    toast.success(done);
  };

  return (
    <li
      className={cn(
        "flex items-center gap-3 rounded-lg border p-3",
        !seat.isActive && "opacity-60",
        seat.member ? "bg-card" : "border-dashed bg-muted/20",
      )}
    >
      {seat.member ? (
        <UserAvatar name={seat.member.name} src={seat.member.avatarUrl} size="sm" />
      ) : (
        <span className="flex size-7 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <BedDouble className="size-3.5" aria-hidden />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{seat.member?.name ?? "Free"}</p>
        <p className="text-xs text-muted-foreground">
          {seat.label} · <MoneyText value={seat.monthlyRent} compact />
          {!seat.isActive && " · not in use"}
        </p>
      </div>
      {canEdit && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8" aria-label={`Options for ${seat.label}`}>
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {seat.member ? (
              <DropdownMenuItem
                onSelect={() =>
                  run(assign({ messId: mess.id, seatId: seat.id, memberId: null }), `${seat.label} is free`)
                }
              >
                Move {seat.member.name.split(" ")[0]} out
              </DropdownMenuItem>
            ) : (
              seat.isActive && (
                <DropdownMenuItem onSelect={() => onDialog({ kind: "assign", seat })}>
                  Put someone here
                </DropdownMenuItem>
              )
            )}
            <DropdownMenuItem onSelect={() => onDialog({ kind: "seat", room, seat })}>
              Edit seat
            </DropdownMenuItem>
            {!seat.member && (
              <DropdownMenuItem
                onSelect={() =>
                  run(
                    updateSeat({ messId: mess.id, seatId: seat.id, isActive: !seat.isActive }),
                    seat.isActive ? `${seat.label} is not in use` : `${seat.label} is back in use`,
                  )
                }
              >
                {seat.isActive ? "Stop using" : "Use again"}
              </DropdownMenuItem>
            )}
            {!seat.member && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={() =>
                    run(deleteSeat({ messId: mess.id, seatId: seat.id }), `${seat.label} removed`)
                  }
                >
                  Remove seat
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </li>
  );
}

function RoomDialog({ onClose }: { onClose: () => void }) {
  const mess = useCurrentMess();
  const [createRoom, { isLoading }] = useCreateRoomMutation();
  const [name, setName] = useState("");
  const [floor, setFloor] = useState("");
  const [error, setError] = useState<string>();

  const submit = async () => {
    if (!name.trim()) return setError("Name the room");
    const res = await createRoom({ messId: mess.id, name: name.trim(), floor: floor.trim() || null });
    if (res.error) return setError(getErrorMessage(res.error));
    toast.success("Room added");
    onClose();
  };

  return (
    <ResponsiveDialog
      open
      onOpenChange={(o) => !o && onClose()}
      title="Add a room"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} loading={isLoading}>
            Add room
          </Button>
        </>
      }
    >
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="room-name">Name</Label>
          <Input
            id="room-name"
            placeholder="Room 1"
            value={name}
            autoFocus
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="room-floor">
            Floor <span className="font-normal text-muted-foreground">(optional)</span>
          </Label>
          <Input id="room-floor" placeholder="2nd" value={floor} onChange={(e) => setFloor(e.target.value)} />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    </ResponsiveDialog>
  );
}

function SeatDialog({ room, seat, onClose }: { room: Room; seat?: Seat; onClose: () => void }) {
  const mess = useCurrentMess();
  const [createSeat, create] = useCreateSeatMutation();
  const [updateSeat, update] = useUpdateSeatMutation();
  const [label, setLabel] = useState(seat?.label ?? "");
  const [rent, setRent] = useState(seat?.monthlyRent ?? "");
  const [error, setError] = useState<string>();

  const submit = async () => {
    if (!label.trim()) return setError("Name the seat");
    if (!isMoney(rent) || Number(rent) <= 0) return setError("Enter the monthly rent");
    const res = seat
      ? await updateSeat({ messId: mess.id, seatId: seat.id, label: label.trim(), monthlyRent: rent })
      : await createSeat({ messId: mess.id, roomId: room.id, label: label.trim(), monthlyRent: rent });
    if (res.error) return setError(getErrorMessage(res.error));
    toast.success(seat ? "Seat updated" : "Seat added");
    onClose();
  };

  return (
    <ResponsiveDialog
      open
      onOpenChange={(o) => !o && onClose()}
      title={seat ? `Edit ${seat.label}` : `Add a seat to ${room.name}`}
      description={seat ? "A new rent applies from the next month that's closed." : undefined}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} loading={create.isLoading || update.isLoading}>
            {seat ? "Save seat" : "Add seat"}
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="seat-label">Seat</Label>
          <Input
            id="seat-label"
            placeholder="Bed A"
            value={label}
            autoFocus
            onChange={(e) => setLabel(e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="seat-rent">Monthly rent</Label>
          <MoneyInput id="seat-rent" placeholder="0" value={rent} onChange={setRent} />
        </div>
        {error && <p className="text-sm text-destructive sm:col-span-2">{error}</p>}
      </div>
    </ResponsiveDialog>
  );
}

function AssignDialog({ seat, onClose }: { seat: Seat; onClose: () => void }) {
  const mess = useCurrentMess();
  const { data: members } = useMembersQuery({ messId: mess.id });
  const { data: board } = useRoomsQuery(mess.id);
  const [assign, { isLoading }] = useAssignSeatMutation();
  const [memberId, setMemberId] = useState("");
  const [error, setError] = useState<string>();
  const seatOf = (id: string) => board?.rooms.flatMap((r) => r.seats).find((s) => s.member?.id === id);

  const submit = async () => {
    if (!memberId) return setError("Pick a member");
    const res = await assign({ messId: mess.id, seatId: seat.id, memberId });
    if (res.error) return setError(getErrorMessage(res.error));
    toast.success(res.data.member ? `${res.data.member.name} is in ${seat.label}` : "Seat updated");
    onClose();
  };

  return (
    <ResponsiveDialog
      open
      onOpenChange={(o) => !o && onClose()}
      title={`Who's in ${seat.label}?`}
      description="Someone who already has a seat moves here, and their old seat becomes free."
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} loading={isLoading}>
            Save
          </Button>
        </>
      }
    >
      <div className="grid gap-2">
        <Label htmlFor="seat-member">Member</Label>
        <Select value={memberId} onValueChange={setMemberId}>
          <SelectTrigger id="seat-member" className="w-full">
            <SelectValue placeholder="Pick a member" />
          </SelectTrigger>
          <SelectContent>
            {members?.map((m) => {
              const current = seatOf(m.id);
              return (
                <SelectItem key={m.id} value={m.id}>
                  {m.user.name}
                  {current && <span className="text-muted-foreground"> · now in {current.label}</span>}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    </ResponsiveDialog>
  );
}
