"use client";

import Link from "next/link";
import {
  CalendarCheck,
  CalendarRange,
  ChevronRight,
  MapPin,
  ShoppingBasket,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { StatCard } from "@/components/common/stat-card";
import { UserAvatar } from "@/components/common/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { messRoutes } from "@/constants/routes";
import { EmailVerificationBanner } from "@/features/auth/components/email-verification-banner";
import { InviteDialog } from "@/features/invitations/components/invite-dialog";
import { useMembersQuery } from "@/features/members/members-api";
import { useCurrentMess, useMessPermissions } from "../mess-context";
import { GENDER_LABELS, ordinal, ROLE_LABELS } from "../utils";
import { JoinCodeCard } from "./join-code-card";

const COMING_NEXT = [
  { icon: CalendarCheck, title: "Daily meals", text: "Members switch meals on or off before the cutoff." },
  { icon: ShoppingBasket, title: "Bazar", text: "Log groceries with receipts, approved by managers." },
  { icon: Wallet, title: "Deposits & bills", text: "Deposits, shared costs and the month's meal rate." },
];

export function MessOverview() {
  const mess = useCurrentMess();
  const { canManage } = useMessPermissions();
  const routes = messRoutes(mess.slug);
  const { data: members, isLoading } = useMembersQuery({ messId: mess.id });
  const { data: requests } = useMembersQuery({ messId: mess.id, status: "PENDING" }, { skip: !canManage });

  return (
    <div className="grid gap-8">
      <PageHeader
        title={mess.name}
        description={
          <span className="inline-flex flex-wrap items-center gap-x-3 gap-y-1">
            {mess.address && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3.5" aria-hidden />
                {mess.address}
              </span>
            )}
            <span>{GENDER_LABELS[mess.gender]}</span>
          </span>
        }
        actions={
          canManage && (
            <InviteDialog
              trigger={(open) => (
                <Button onClick={open}>
                  <UserPlus />
                  Invite members
                </Button>
              )}
            />
          )
        }
      />

      <EmailVerificationBanner />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        <StatCard
          className="col-span-2 sm:col-span-1"
          label="Members"
          icon={Users}
          value={mess.activeMemberCount ?? "–"}
          helper={
            canManage && requests?.length ? (
              <Link
                href={`${routes.members}?tab=requests`}
                className="font-medium text-primary hover:underline"
              >
                {requests.length} waiting for approval
              </Link>
            ) : (
              "Active in this mess"
            )
          }
        />
        <StatCard
          label="Your role"
          value={ROLE_LABELS[mess.membership.role]}
          helper={mess.membership.isMonthManager ? "Manager of this month" : "In this mess"}
        />
        <StatCard
          label="Billing month"
          icon={CalendarRange}
          value={ordinal(mess.monthStartDay)}
          helper="Each billing month starts on this day"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_22rem]">
        <Card>
          <CardHeader>
            <CardTitle>Members</CardTitle>
            <CardDescription>Everyone who eats and pays in this mess.</CardDescription>
            <CardAction>
              <Button variant="ghost" size="sm" asChild>
                <Link href={routes.members}>
                  View all
                  <ChevronRight />
                </Link>
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="grid gap-3">
                {Array.from({ length: 3 }, (_, i) => (
                  <Skeleton key={i} className="h-10" />
                ))}
              </div>
            ) : (
              <ul className="divide-y">
                {members?.slice(0, 6).map((m) => (
                  <li key={m.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                    <UserAvatar name={m.user.name} src={m.user.avatarUrl} size="sm" />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">{m.user.name}</span>
                    {m.role !== "MEMBER" && <Badge variant="secondary">{ROLE_LABELS[m.role]}</Badge>}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {canManage && <JoinCodeCard />}
      </div>

      <section aria-labelledby="coming-next" className="grid gap-3">
        <h2 id="coming-next" className="text-sm font-medium text-muted-foreground">
          Coming next to {mess.name}
        </h2>
        <ul className="grid gap-3 sm:grid-cols-3">
          {COMING_NEXT.map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex gap-3 rounded-xl border border-dashed p-4">
              <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
              <div>
                <p className="text-sm font-medium">{title}</p>
                <p className="text-xs text-muted-foreground">{text}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
