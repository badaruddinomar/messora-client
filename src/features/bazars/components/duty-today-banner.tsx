"use client";

import Link from "next/link";
import { ShoppingBasket } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { messRoutes } from "@/constants/routes";
import { useCurrentMess } from "@/features/messes/mess-context";
import { todayIn } from "@/lib/date";
import { useBazarDutiesQuery } from "../bazars-api";
import { BazarFormDialog } from "./bazar-form-dialog";

/** "You're on bazar duty today", with a shortcut to add the bazar, until it's done. */
export function DutyTodayBanner() {
  const mess = useCurrentMess();
  const { data } = useBazarDutiesQuery({ messId: mess.id });
  const today = todayIn(mess.timezone);
  const duty = data?.duties.find((d) => d.date === today && d.member.id === mess.membership.id && !d.isDone);
  if (!duty) return null;

  return (
    <Alert variant="warning">
      <ShoppingBasket />
      <AlertTitle>You&apos;re on bazar duty today</AlertTitle>
      <AlertDescription className="flex flex-wrap items-center gap-x-3 gap-y-2 text-current/80">
        Add the bazar with a photo of the receipt when you&apos;re back.
        <span className="flex gap-2">
          <BazarFormDialog
            trigger={(open) => (
              <Button size="sm" onClick={open}>
                Add bazar
              </Button>
            )}
          />
          <Button size="sm" variant="ghost" asChild>
            <Link href={`${messRoutes(mess.slug).bazar}?tab=duty`}>See duty</Link>
          </Button>
        </span>
      </AlertDescription>
    </Alert>
  );
}
