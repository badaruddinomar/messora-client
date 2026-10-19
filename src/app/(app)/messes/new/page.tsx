import type { Metadata } from "next";
import { CreateMessWizard } from "@/features/messes/components/create-mess-wizard";

export const metadata: Metadata = { title: "Create a mess" };

export default function NewMessPage() {
  return <CreateMessWizard />;
}
