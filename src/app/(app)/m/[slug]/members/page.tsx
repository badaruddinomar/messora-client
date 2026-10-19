import type { Metadata } from "next";
import { MembersPage } from "@/features/members/components/members-page";

export const metadata: Metadata = { title: "Members" };

export default function MessMembersPage() {
  return <MembersPage />;
}
