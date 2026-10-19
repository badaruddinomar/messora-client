import type { Metadata } from "next";
import { DashboardRedirect } from "@/features/messes/components/dashboard-redirect";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return <DashboardRedirect />;
}
