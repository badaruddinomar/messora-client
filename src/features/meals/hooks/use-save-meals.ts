"use client";

import { toast } from "sonner";
import { useCurrentMess } from "@/features/messes/mess-context";
import { getErrorMessage, type RequestError } from "@/lib/api-error";
import { useSaveMealsMutation } from "../meals-api";
import type { MealEntryInput } from "../meals-types";

/**
 * Saves meal changes optimistically: the screen updates at once, and if the server refuses
 * (e.g. the cutoff just passed) the change is rolled back with a toast explaining why.
 */
export function useSaveMeals() {
  const mess = useCurrentMess();
  const [saveMeals, state] = useSaveMealsMutation();

  const save = async (entries: MealEntryInput[]) => {
    const res = await saveMeals({ messId: mess.id, entries });
    if (res.error) {
      toast.error("Couldn't save your meals", { description: getErrorMessage(res.error as RequestError) });
      return false;
    }
    return true;
  };

  return [save, state] as const;
}
