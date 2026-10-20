import type { Metadata } from "next";
import { BazarsPage } from "@/features/bazars/components/bazars-page";

export const metadata: Metadata = { title: "Bazar" };

export default function MessBazarPage() {
  return <BazarsPage />;
}
