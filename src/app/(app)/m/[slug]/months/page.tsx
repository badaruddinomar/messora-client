import type { Metadata } from "next";
import { MonthsPage } from "@/features/months/components/months-page";

export const metadata: Metadata = { title: "Months" };

export default function MessMonthsPage() {
  return <MonthsPage />;
}
