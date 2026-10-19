"use client";

import { useMemo } from "react";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import type { ColumnDef } from "@tanstack/react-table";
import { Check, Inbox, MailPlus, UserPlus, Users, X } from "lucide-react";
import { toast } from "sonner";
import { DataTable } from "@/components/common/data-table";
import { DateText } from "@/components/common/date-text";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { PageHeader } from "@/components/common/page-header";
import { StatusBadge } from "@/components/common/status-badge";
import { UserAvatar } from "@/components/common/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InviteDialog } from "@/features/invitations/components/invite-dialog";
import { useMessInvitationsQuery, useRevokeInvitationMutation } from "@/features/invitations/invitations-api";
import type { Invitation } from "@/features/invitations/invitations-types";
import { useCurrentMess, useMessPermissions } from "@/features/messes/mess-context";
import { ROLE_LABELS } from "@/features/messes/utils";
import { getErrorMessage } from "@/lib/api-error";
import { useApproveMemberMutation, useMembersQuery, useRejectMemberMutation } from "../members-api";
import type { Member } from "../members-types";
import { MemberActions } from "./member-actions";

const TABS = ["active", "requests", "invited", "left"] as const;

export function MembersPage() {
  const mess = useCurrentMess();
  const { canManage, isAdmin } = useMessPermissions();
  // Manager-only tabs fall back to "active" for everyone else.
  const [tabParam, setTab] = useQueryState("tab", parseAsStringLiteral(TABS).withDefault("active"));
  const tab = !canManage && (tabParam === "requests" || tabParam === "invited") ? "active" : tabParam;

  const { data: requests } = useMembersQuery({ messId: mess.id, status: "PENDING" }, { skip: !canManage });

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Members"
        description={`${mess.activeMemberCount ?? 0} active ${mess.activeMemberCount === 1 ? "member" : "members"} in ${mess.name}`}
        actions={
          canManage && (
            <InviteDialog
              trigger={(open) => (
                <Button onClick={open}>
                  <UserPlus />
                  Invite
                </Button>
              )}
            />
          )
        }
      />

      <Tabs value={tab} onValueChange={(v) => setTab(v as (typeof TABS)[number])}>
        <TabsList>
          <TabsTrigger value="active">Active</TabsTrigger>
          {canManage && (
            <TabsTrigger value="requests">
              Requests
              {!!requests?.length && (
                <Badge className="tabular h-5 min-w-5 px-1.5" aria-label={`${requests.length} pending`}>
                  {requests.length}
                </Badge>
              )}
            </TabsTrigger>
          )}
          {canManage && <TabsTrigger value="invited">Invited</TabsTrigger>}
          <TabsTrigger value="left">Left</TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          <ActiveMembers showActions={isAdmin} />
        </TabsContent>
        {canManage && (
          <TabsContent value="requests">
            <JoinRequests />
          </TabsContent>
        )}
        {canManage && (
          <TabsContent value="invited">
            <PendingInvitations />
          </TabsContent>
        )}
        <TabsContent value="left">
          <FormerMembers />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ---------- Active ----------

function ActiveMembers({ showActions }: { showActions: boolean }) {
  const mess = useCurrentMess();
  const active = useMembersQuery({ messId: mess.id });
  // Admins also see suspended members here, so they can reactivate them.
  const suspended = useMembersQuery({ messId: mess.id, status: "SUSPENDED" }, { skip: !showActions });
  const rows = useMemo(
    () => [...(active.data ?? []), ...(suspended.data ?? [])],
    [active.data, suspended.data],
  );

  const columns = useMemo<ColumnDef<Member, unknown>[]>(
    () => [
      {
        id: "member",
        header: "Member",
        accessorFn: (m) => m.user.name,
        cell: ({ row }) => (
          <MemberIdentity member={row.original} isYou={row.original.id === mess.membership.id} />
        ),
      },
      {
        id: "role",
        header: "Role",
        accessorFn: (m) => m.role,
        cell: ({ row }) =>
          row.original.status === "SUSPENDED" ? (
            <StatusBadge status="SUSPENDED" />
          ) : (
            <Badge variant={row.original.role === "MEMBER" ? "outline" : "secondary"}>
              {ROLE_LABELS[row.original.role]}
            </Badge>
          ),
      },
      {
        id: "joined",
        header: "Joined",
        accessorFn: (m) => m.joinedAt ?? "",
        cell: ({ row }) =>
          row.original.joinedAt ? (
            <DateText value={row.original.joinedAt} className="text-muted-foreground" />
          ) : null,
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        enableSorting: false,
        meta: { align: "right" },
        cell: ({ row }) =>
          showActions && row.original.id !== mess.membership.id ? (
            <MemberActions member={row.original} />
          ) : null,
      },
    ],
    [mess.membership.id, showActions],
  );

  if (active.error)
    return <ErrorState error={active.error} onRetry={active.refetch} retrying={active.isFetching} />;

  return (
    <DataTable
      columns={columns}
      data={rows}
      isLoading={active.isLoading}
      getRowId={(m) => m.id}
      empty={<EmptyState icon={Users} title="No members yet" description="Invite people to get started." />}
      renderCard={(row) => (
        <div className="flex items-center gap-3">
          <MemberIdentity member={row.original} isYou={row.original.id === mess.membership.id} />
          <div className="ml-auto flex items-center gap-1">
            {row.original.status === "SUSPENDED" ? (
              <StatusBadge status="SUSPENDED" />
            ) : (
              row.original.role !== "MEMBER" && (
                <Badge variant="secondary">{ROLE_LABELS[row.original.role]}</Badge>
              )
            )}
            {showActions && row.original.id !== mess.membership.id && <MemberActions member={row.original} />}
          </div>
        </div>
      )}
    />
  );
}

function MemberIdentity({ member, isYou }: { member: Member; isYou?: boolean }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <UserAvatar name={member.user.name} src={member.user.avatarUrl} />
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">
          {member.user.name}
          {isYou && <span className="ml-1.5 font-normal text-muted-foreground">(you)</span>}
        </p>
        <a
          href={`tel:${member.user.phone}`}
          className="tabular truncate text-xs text-muted-foreground hover:text-foreground"
          onClick={(e) => e.stopPropagation()}
        >
          {member.user.phone}
        </a>
      </div>
    </div>
  );
}

// ---------- Requests ----------

function JoinRequests() {
  const mess = useCurrentMess();
  const { data, isLoading, error, refetch, isFetching } = useMembersQuery({
    messId: mess.id,
    status: "PENDING",
  });

  if (error) return <ErrorState error={error} onRetry={refetch} retrying={isFetching} />;
  if (isLoading) return <ListSkeleton />;
  if (!data?.length) {
    return (
      <EmptyState
        icon={Inbox}
        title="No requests right now"
        description="When someone uses your join code, their request shows up here."
      />
    );
  }
  return (
    <ul className="grid gap-3">
      {data.map((m) => (
        <JoinRequestRow key={m.id} member={m} />
      ))}
    </ul>
  );
}

function JoinRequestRow({ member }: { member: Member }) {
  const mess = useCurrentMess();
  const [approve, approveState] = useApproveMemberMutation();
  const [reject, rejectState] = useRejectMemberMutation();
  const busy = approveState.isLoading || rejectState.isLoading;
  const args = { messId: mess.id, memberId: member.id };
  const name = member.user.name.split(" ")[0];

  return (
    <li className="animate-in duration-200 fade-in-0">
      <Card className="flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center">
        <MemberIdentity member={member} />
        <p className="text-xs text-muted-foreground sm:ml-auto">
          Asked <DateText value={member.requestedAt} variant="relative" />
        </p>
        <div className="flex gap-2">
          <Button
            size="sm"
            className="flex-1 sm:flex-none"
            loading={approveState.isLoading}
            disabled={busy}
            onClick={async () => {
              const res = await approve(args);
              if (res.error) toast.error(getErrorMessage(res.error));
              else toast.success(`${name} joined ${mess.name}`);
            }}
          >
            <Check />
            Approve
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1 sm:flex-none"
            loading={rejectState.isLoading}
            disabled={busy}
            onClick={async () => {
              const res = await reject(args);
              if (res.error) toast.error(getErrorMessage(res.error));
              else toast.success("Request declined");
            }}
          >
            <X />
            Decline
          </Button>
        </div>
      </Card>
    </li>
  );
}

// ---------- Invited ----------

function PendingInvitations() {
  const mess = useCurrentMess();
  const { data, isLoading, error, refetch, isFetching } = useMessInvitationsQuery(mess.id);

  if (error) return <ErrorState error={error} onRetry={refetch} retrying={isFetching} />;
  if (isLoading) return <ListSkeleton />;
  if (!data?.length) {
    return (
      <EmptyState
        icon={MailPlus}
        title="No open invitations"
        description="Invite people by phone or email. They join as soon as they accept."
        action={
          <InviteDialog
            trigger={(open) => (
              <Button onClick={open}>
                <UserPlus />
                Invite someone
              </Button>
            )}
          />
        }
      />
    );
  }
  return (
    <ul className="grid gap-3">
      {data.map((inv) => (
        <InvitationRow key={inv.id} invitation={inv} />
      ))}
    </ul>
  );
}

function InvitationRow({ invitation }: { invitation: Invitation }) {
  const mess = useCurrentMess();
  const [revoke, { isLoading }] = useRevokeInvitationMutation();
  const target = invitation.email ?? invitation.phone ?? "";

  return (
    <li>
      <Card className="flex-row items-center gap-3 px-4 py-4">
        <UserAvatar name={target.replace(/[^a-zA-Z]/g, " ") || "?"} />
        <div className="min-w-0 flex-1">
          <p className="tabular truncate text-sm font-medium">{target}</p>
          <p className="text-xs text-muted-foreground">
            {ROLE_LABELS[invitation.role]} ·{" "}
            {invitation.status === "EXPIRED" ? (
              "Expired"
            ) : (
              <>
                expires <DateText value={invitation.expiresAt} variant="relative" />
              </>
            )}
          </p>
        </div>
        {invitation.status === "EXPIRED" && <StatusBadge status="EXPIRED" />}
        <Button
          variant="ghost"
          size="sm"
          loading={isLoading}
          onClick={async () => {
            const res = await revoke({ messId: mess.id, invitationId: invitation.id });
            if (res.error) toast.error(getErrorMessage(res.error));
            else toast.success("Invitation cancelled");
          }}
        >
          {invitation.status === "EXPIRED" ? "Remove" : "Cancel"}
        </Button>
      </Card>
    </li>
  );
}

// ---------- Left ----------

function FormerMembers() {
  const mess = useCurrentMess();
  const { data, isLoading, error, refetch, isFetching } = useMembersQuery({
    messId: mess.id,
    status: "LEFT",
  });

  const columns = useMemo<ColumnDef<Member, unknown>[]>(
    () => [
      {
        id: "member",
        header: "Member",
        accessorFn: (m) => m.user.name,
        cell: ({ row }) => <MemberIdentity member={row.original} />,
      },
      {
        id: "left",
        header: "Left on",
        accessorFn: (m) => m.leftAt ?? "",
        cell: ({ row }) => (row.original.leftAt ? <DateText value={row.original.leftAt} /> : null),
      },
      {
        id: "reason",
        header: "Reason",
        enableSorting: false,
        cell: ({ row }) => <span className="text-muted-foreground">{row.original.leaveReason ?? "—"}</span>,
      },
    ],
    [],
  );

  if (error) return <ErrorState error={error} onRetry={refetch} retrying={isFetching} />;
  return (
    <DataTable
      columns={columns}
      data={data}
      isLoading={isLoading}
      getRowId={(m) => m.id}
      empty={
        <EmptyState icon={Users} title="Nobody has left" description="Members who leave are listed here." />
      }
      renderCard={(row) => (
        <div className="flex items-center gap-3">
          <MemberIdentity member={row.original} />
          {row.original.leftAt && (
            <span className="ml-auto text-xs text-muted-foreground">
              Left <DateText value={row.original.leftAt} />
            </span>
          )}
        </div>
      )}
    />
  );
}

function ListSkeleton() {
  return (
    <div className="grid gap-3" aria-busy>
      {Array.from({ length: 3 }, (_, i) => (
        <Skeleton key={i} className="h-20 rounded-xl" />
      ))}
    </div>
  );
}
