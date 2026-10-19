"use client";

import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

/** Placeholder until Phase 10: then it shows the live unread count and a dropdown. */
export function NotificationBell() {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Notifications" className="text-muted-foreground">
          <Bell className="size-5" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>Notifications are coming soon</TooltipContent>
    </Tooltip>
  );
}
