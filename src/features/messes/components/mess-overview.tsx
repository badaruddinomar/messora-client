"use client";

import Link from "next/link";
import { format } from "date-fns";
import {
  CalendarRange,
  ChevronRight,
  MapPin,
  MessageCircle,
  ReceiptText,
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
import { MoneyText } from "@/components/common/money-text";
import { useBazarSummaryQuery } from "@/features/bazars/bazars-api";
import { DutyTodayBanner } from "@/features/bazars/components/duty-today-banner";
import { EmailVerificationBanner } from "@/features/auth/components/email-verification-banner";
import { TodaysMealsCard } from "@/features/meals/components/todays-meals-card";
import { InviteDialog } from "@/features/invitations/components/invite-dialog";
import { useMembersQuery } from "@/features/members/members-api";
import { BalancePreviewCard } from "@/features/months/components/balance-preview-card";
import { useMonthsQuery } from "@/features/months/months-api";
import { daysLeft } from "@/features/months/utils";
import { useCurrentMess, useMessPermissions } from "../mess-context";
import { GENDER_LABELS, ROLE_LABELS } from "../utils";
import { JoinCodeCard } from "./join-code-card";

const COMING_NEXT = [
  { icon: ReceiptText, title: "Shared costs & charges", text: "Rent, utilities, staff and other bills." },
  { icon: Wallet, title: "Closing the month", text: "Final bills, dues, refunds and the fund handover." },
  { icon: MessageCircle, title: "Chat & notices", text: "Talk to the mess and pin announcements." },
];

export function MessOverview() {
  const mess = useCurrentMess();
  const { canManage } = useMessPermissions();
  const routes = messRoutes(mess.slug);
  const { data: members, isLoading } = useMembersQuery({ messId: mess.id });
  const { data: requests } = useMembersQuery({ messId: mess.id, status: "PENDING" }, { skip: !canManage });
  const { data: months } = useMonthsQuery(mess.id);
  const currentMonth = months?.find((m) => m.isCurrent);
  const { data: bazar } = useBazarSummaryQuery(
    { messId: mess.id, monthId: currentMonth?.id },
    { skip: !currentMonth },
  );

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
            <span>
              Your role:{" "}
              {mess.membership.isMonthManager ? "Manager of this month" : ROLE_LABELS[mess.membership.role]}
            </span>
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
      <DutyTodayBanner />

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
          label="Bazar this month"
          icon={ShoppingBasket}
          value={bazar ? <MoneyText value={bazar.approved.total} compact /> : "–"}
          helper={
            canManage && bazar?.pending.count ? (
              <Link href={`${routes.bazar}?tab=review`} className="font-medium text-primary hover:underline">
                {bazar.pending.count} waiting for approval
              </Link>
            ) : (
              <Link href={routes.bazar} className="hover:text-foreground hover:underline">
                {bazar ? `${bazar.approved.count} approved` : "Loading…"}
              </Link>
            )
          }
        />
        <StatCard
          label="This month"
          icon={CalendarRange}
          value={currentMonth ? format(new Date(currentMonth.year, currentMonth.month - 1), "MMMM") : "–"}
          helper={
            currentMonth ? (
              <Link href={routes.months} className="hover:text-foreground hover:underline">
                {daysLeft(currentMonth)} days left
                {currentMonth.manager ? ` · Managed by ${currentMonth.manager.name.split(" ")[0]}` : ""}
              </Link>
            ) : (
              "Loading…"
            )
          }
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_22rem] lg:items-start">
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

        <div className="grid content-start gap-4">
          <BalancePreviewCard />
          <TodaysMealsCard />
          {canManage && <JoinCodeCard />}
        </div>
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
