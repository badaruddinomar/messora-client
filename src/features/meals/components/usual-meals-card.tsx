"use client";

import { toast } from "sonner";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useCurrentMess } from "@/features/messes/mess-context";
import { getErrorMessage } from "@/lib/api-error";
import { useSetUsualMealsMutation } from "../meals-api";

/** Whether the member is counted for every meal by default (BUSINESS_RULES §4). */
export function UsualMealsCard({ defaultMealOn }: { defaultMealOn: boolean }) {
  const mess = useCurrentMess();
  const [setUsualMeals, { isLoading }] = useSetUsualMealsMutation();

  const onChange = async (next: boolean) => {
    const res = await setUsualMeals({ messId: mess.id, defaultMealOn: next });
    if (res.error) {
      toast.error("Couldn't change your usual meals", { description: getErrorMessage(res.error) });
      return;
    }
    toast.success(next ? "Usual meals turned on" : "Usual meals turned off", {
      description: "Your upcoming days follow the new setting.",
    });
  };

  return (
    <Card className="gap-3">
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <CardTitle>
            <Label htmlFor="usual-meals">Usual meals</Label>
          </CardTitle>
          <Switch id="usual-meals" checked={defaultMealOn} disabled={isLoading} onCheckedChange={onChange} />
        </div>
        <CardDescription>
          {defaultMealOn
            ? "You're counted for every meal unless you switch it off or take a meal-off."
            : "You're not counted unless you switch a meal on."}
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
