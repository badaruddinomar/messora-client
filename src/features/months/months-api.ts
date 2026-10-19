import { api, messUrl } from "@/store/api";
import type { ApiResponse } from "@/types/api";
import type { Month } from "./months-types";

const monthsTag = (messId: string) => ({ type: "Months" as const, id: messId });

export const monthsApi = api.injectEndpoints({
  endpoints: (build) => ({
    /** All billing months, newest first. Fetching it also opens the current month on the server. */
    months: build.query<Month[], string>({
      query: (messId) => messUrl(messId, "/months"),
      transformResponse: (res: ApiResponse<Month[]>) => res.data,
      providesTags: (_r, _e, messId) => [monthsTag(messId)],
    }),

    setMonthManager: build.mutation<Month, { messId: string; monthId: string; managerId: string | null }>({
      query: ({ messId, monthId, managerId }) => ({
        url: messUrl(messId, `/months/${monthId}/manager`),
        method: "PATCH",
        body: { managerId },
      }),
      transformResponse: (res: ApiResponse<Month>) => res.data,
      // The manager gets (or loses) manager powers, which shows up in the mess list too.
      invalidatesTags: (_r, _e, { messId }) => [monthsTag(messId), { type: "Mess", id: "LIST" }],
    }),
  }),
});

export const { useMonthsQuery, useSetMonthManagerMutation } = monthsApi;
