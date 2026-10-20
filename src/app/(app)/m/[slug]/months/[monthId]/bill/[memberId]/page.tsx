import type { Metadata } from "next";
import { BillPage } from "@/features/months/components/bill-page";

export const metadata: Metadata = { title: "Bill" };

export default function MessBillPage() {
  return <BillPage />;
}
