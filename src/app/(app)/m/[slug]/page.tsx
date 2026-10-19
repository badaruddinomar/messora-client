import type { Metadata } from "next";
import { MessOverview } from "@/features/messes/components/mess-overview";

export const metadata: Metadata = { title: "Overview" };

export default function MessOverviewPage() {
  return <MessOverview />;
}
