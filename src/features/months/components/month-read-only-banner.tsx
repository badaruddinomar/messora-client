import { Lock } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { Month } from "../months-types";
import { monthLabel } from "../utils";

/**
 * Shown on meal and money screens when the selected month can't be changed any more.
 * Pair it with disabled actions (BUSINESS_RULES §3).
 */
export function MonthReadOnlyBanner({ month }: { month: Month }) {
  if (month.status === "OPEN") return null;
  return (
    <Alert>
      <Lock />
      <AlertTitle>
        {monthLabel(month)} is {month.status === "CLOSING" ? "being closed" : "closed"}
      </AlertTitle>
      <AlertDescription>
        {month.status === "CLOSING"
          ? "Changes are paused while the bill is reviewed. An admin can reopen it if something is missing."
          : "Its numbers are final. Corrections go into a later month as an adjustment."}
      </AlertDescription>
    </Alert>
  );
}
