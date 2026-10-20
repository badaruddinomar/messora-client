import type { PersonRef } from "@/features/meals/meals-types";
import type { Money } from "@/types/api";

export interface Seat {
  id: string;
  roomId: string;
  label: string;
  monthlyRent: Money;
  isActive: boolean;
  member: PersonRef | null;
}

export interface Room {
  id: string;
  name: string;
  floor: string | null;
  seats: Seat[];
}

export interface RoomsBoard {
  rooms: Room[];
  summary: { seats: number; occupied: number; vacant: number; monthlyRent: Money };
}
