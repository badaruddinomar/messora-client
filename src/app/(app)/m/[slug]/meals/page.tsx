import type { Metadata } from "next";
import { MealsPage } from "@/features/meals/components/meals-page";

export const metadata: Metadata = { title: "Meals" };

export default function MessMealsPage() {
  return <MealsPage />;
}
