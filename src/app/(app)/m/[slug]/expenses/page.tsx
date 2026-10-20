import type { Metadata } from "next";
import { ExpensesPage } from "@/features/expenses/components/expenses-page";

export const metadata: Metadata = { title: "Expenses" };

export default function MessExpensesPage() {
  return <ExpensesPage />;
}
