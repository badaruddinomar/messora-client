import type { Metadata } from "next";
import { MonthDetailPage } from "@/features/months/components/month-detail-page";

export const metadata: Metadata = { title: "Month" };

export default function MessMonthPage() {
  return <MonthDetailPage />;
}
