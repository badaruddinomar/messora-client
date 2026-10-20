import type { Metadata } from "next";
import { DepositsPage } from "@/features/deposits/components/deposits-page";

export const metadata: Metadata = { title: "Deposits" };

export default function MessDepositsPage() {
  return <DepositsPage />;
}
