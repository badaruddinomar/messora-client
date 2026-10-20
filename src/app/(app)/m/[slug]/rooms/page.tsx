import type { Metadata } from "next";
import { RoomsPage } from "@/features/rooms/components/rooms-page";

export const metadata: Metadata = { title: "Rooms & seats" };

export default function MessRoomsPage() {
  return <RoomsPage />;
}
