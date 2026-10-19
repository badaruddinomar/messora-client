import type { Metadata } from "next";
import { MessSettingsPage } from "@/features/messes/components/mess-settings";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return <MessSettingsPage />;
}
