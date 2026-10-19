import type { Metadata } from "next";
import { MessesHub } from "@/features/messes/components/messes-hub";

export const metadata: Metadata = { title: "My messes" };

export default function MessesPage() {
  return <MessesHub />;
}
