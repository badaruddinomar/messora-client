"use client";

import Link from "next/link";
import { ChevronRight, ShoppingBasket } from "lucide-react";
import { Card } from "@/components/ui/card";
import { messRoutes } from "@/constants/routes";
import { useCurrentMess } from "@/features/messes/mess-context";
import { formatDate, formatDay } from "@/lib/format";
import type { Dashboard } from "../reports-types";

/** "Your next bazar duty: Saturday". Today's duty has its own banner, so this is for later ones. */
export function NextDutyCard({ dashboard }: { dashboard?: Dashboard }) {
  const mess = useCurrentMess();
  const duty = dashboard?.you.nextDuty;
  if (!dashboard || !duty || duty === dashboard.today) return null;

  return (
    <Card className="p-0">
      <Link
        href={`${messRoutes(mess.slug).bazar}?tab=duty`}
        className="flex items-center gap-3 rounded-xl px-5 py-4 transition-colors hover:bg-muted/40"
      >
        <span className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary">
          <ShoppingBasket className="size-4" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-xs text-muted-foreground">Your next bazar duty</span>
          <span className="block text-sm font-medium">
            {formatDay(duty) === "Tomorrow"
              ? `Tomorrow, ${formatDate(duty, "d MMM")}`
              : formatDate(duty, "EEEE, d MMM")}
          </span>
        </span>
        <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
      </Link>
    </Card>
  );
}
