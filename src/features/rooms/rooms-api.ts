import { api, messUrl } from "@/store/api";
import type { ApiResponse } from "@/types/api";
import type { Room, RoomsBoard, Seat } from "./rooms-types";

const data = <T>(res: ApiResponse<T>) => res.data;
/** Seats feed the seat-rent estimate in the month preview. */
const tags = (messId: string) => [
  { type: "Rooms" as const, id: messId },
  { type: "MonthPreview" as const, id: messId },
];

export const roomsApi = api.injectEndpoints({
  endpoints: (build) => ({
    rooms: build.query<RoomsBoard, string>({
      query: (messId) => messUrl(messId, "/rooms"),
      transformResponse: data<RoomsBoard>,
      providesTags: (_r, _e, messId) => [{ type: "Rooms", id: messId }],
    }),
    createRoom: build.mutation<Room, { messId: string; name: string; floor?: string | null }>({
      query: ({ messId, ...body }) => ({ url: messUrl(messId, "/rooms"), method: "POST", body }),
      transformResponse: data<Room>,
      invalidatesTags: (_r, _e, { messId }) => tags(messId),
    }),
    updateRoom: build.mutation<
      Room,
      { messId: string; roomId: string; name?: string; floor?: string | null }
    >({
      query: ({ messId, roomId, ...body }) => ({
        url: messUrl(messId, `/rooms/${roomId}`),
        method: "PATCH",
        body,
      }),
      transformResponse: data<Room>,
      invalidatesTags: (_r, _e, { messId }) => tags(messId),
    }),
    deleteRoom: build.mutation<void, { messId: string; roomId: string }>({
      query: ({ messId, roomId }) => ({ url: messUrl(messId, `/rooms/${roomId}`), method: "DELETE" }),
      transformResponse: () => undefined,
      invalidatesTags: (_r, _e, { messId }) => tags(messId),
    }),
    createSeat: build.mutation<Seat, { messId: string; roomId: string; label: string; monthlyRent: string }>({
      query: ({ messId, roomId, ...body }) => ({
        url: messUrl(messId, `/rooms/${roomId}/seats`),
        method: "POST",
        body,
      }),
      transformResponse: data<Seat>,
      invalidatesTags: (_r, _e, { messId }) => tags(messId),
    }),
    updateSeat: build.mutation<
      Seat,
      { messId: string; seatId: string; label?: string; monthlyRent?: string; isActive?: boolean }
    >({
      query: ({ messId, seatId, ...body }) => ({
        url: messUrl(messId, `/rooms/seats/${seatId}`),
        method: "PATCH",
        body,
      }),
      transformResponse: data<Seat>,
      invalidatesTags: (_r, _e, { messId }) => tags(messId),
    }),
    deleteSeat: build.mutation<void, { messId: string; seatId: string }>({
      query: ({ messId, seatId }) => ({ url: messUrl(messId, `/rooms/seats/${seatId}`), method: "DELETE" }),
      transformResponse: () => undefined,
      invalidatesTags: (_r, _e, { messId }) => tags(messId),
    }),
    assignSeat: build.mutation<Seat, { messId: string; seatId: string; memberId: string | null }>({
      query: ({ messId, seatId, memberId }) => ({
        url: messUrl(messId, `/rooms/seats/${seatId}/member`),
        method: "PUT",
        body: { memberId },
      }),
      transformResponse: data<Seat>,
      invalidatesTags: (_r, _e, { messId }) => tags(messId),
    }),
  }),
});

export const {
  useRoomsQuery,
  useCreateRoomMutation,
  useUpdateRoomMutation,
  useDeleteRoomMutation,
  useCreateSeatMutation,
  useUpdateSeatMutation,
  useDeleteSeatMutation,
  useAssignSeatMutation,
} = roomsApi;
