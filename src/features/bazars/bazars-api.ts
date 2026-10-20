import { api, messUrl } from "@/store/api";
import type { ApiResponse, Page } from "@/types/api";
import type { Bazar, BazarDuty, BazarFilters, BazarInput, BazarSummary, UploadTarget } from "./bazars-types";

const data = <T>(res: ApiResponse<T>) => res.data;
const bazarsTag = (messId: string) => ({ type: "Bazars" as const, id: messId });
const dutiesTag = (messId: string) => ({ type: "BazarDuties" as const, id: messId });

type DutiesResponse = { monthId: string; duties: BazarDuty[] };

export const bazarsApi = api.injectEndpoints({
  endpoints: (build) => ({
    /** Newest first, a page at a time ("Load more"). */
    bazars: build.infiniteQuery<Page<Bazar>, { messId: string } & BazarFilters, string | null>({
      infiniteQueryOptions: {
        initialPageParam: null,
        getNextPageParam: (last) => last.nextCursor,
      },
      query: ({ queryArg: { messId, ...filters }, pageParam }) => ({
        url: messUrl(messId, "/bazars"),
        params: { limit: 20, ...filters, ...(pageParam && { cursor: pageParam }) },
      }),
      transformResponse: data<Page<Bazar>>,
      providesTags: (_r, _e, { messId }) => [bazarsTag(messId)],
    }),
    bazarSummary: build.query<BazarSummary, { messId: string; monthId?: string }>({
      query: ({ messId, monthId }) => ({
        url: messUrl(messId, "/bazars/summary"),
        params: monthId ? { monthId } : {},
      }),
      transformResponse: data<BazarSummary>,
      providesTags: (_r, _e, { messId }) => [bazarsTag(messId)],
    }),

    createBazar: build.mutation<Bazar, { messId: string } & BazarInput>({
      query: ({ messId, ...body }) => ({ url: messUrl(messId, "/bazars"), method: "POST", body }),
      transformResponse: data<Bazar>,
      // A bazar can complete a duty, so duties refresh too.
      invalidatesTags: (_r, _e, { messId }) => [bazarsTag(messId), dutiesTag(messId)],
    }),
    updateBazar: build.mutation<Bazar, { messId: string; bazarId: string } & Partial<BazarInput>>({
      query: ({ messId, bazarId, ...body }) => ({
        url: messUrl(messId, `/bazars/${bazarId}`),
        method: "PATCH",
        body,
      }),
      transformResponse: data<Bazar>,
      invalidatesTags: (_r, _e, { messId }) => [bazarsTag(messId)],
    }),
    deleteBazar: build.mutation<void, { messId: string; bazarId: string }>({
      query: ({ messId, bazarId }) => ({ url: messUrl(messId, `/bazars/${bazarId}`), method: "DELETE" }),
      transformResponse: () => undefined,
      invalidatesTags: (_r, _e, { messId }) => [bazarsTag(messId)],
    }),
    approveBazar: build.mutation<Bazar, { messId: string; bazarId: string }>({
      query: ({ messId, bazarId }) => ({
        url: messUrl(messId, `/bazars/${bazarId}/approve`),
        method: "POST",
      }),
      transformResponse: data<Bazar>,
      invalidatesTags: (_r, _e, { messId }) => [bazarsTag(messId)],
    }),
    rejectBazar: build.mutation<Bazar, { messId: string; bazarId: string; reason: string }>({
      query: ({ messId, bazarId, reason }) => ({
        url: messUrl(messId, `/bazars/${bazarId}/reject`),
        method: "POST",
        body: { reason },
      }),
      transformResponse: data<Bazar>,
      invalidatesTags: (_r, _e, { messId }) => [bazarsTag(messId)],
    }),

    createUpload: build.mutation<
      { key: string; upload: UploadTarget },
      { messId: string; purpose: "receipt"; contentType: string; size: number }
    >({
      query: ({ messId, ...body }) => ({ url: messUrl(messId, "/uploads"), method: "POST", body }),
      transformResponse: data<{ key: string; upload: UploadTarget }>,
    }),

    // ---------- duty ----------
    bazarDuties: build.query<DutiesResponse, { messId: string; monthId?: string }>({
      query: ({ messId, monthId }) => ({
        url: messUrl(messId, "/bazar-duties"),
        params: monthId ? { monthId } : {},
      }),
      transformResponse: data<DutiesResponse>,
      providesTags: (_r, _e, { messId }) => [dutiesTag(messId)],
    }),
    planDuties: build.mutation<
      DutiesResponse,
      {
        messId: string;
        monthId?: string;
        memberIds: string[];
        everyDays: number;
        perDay: number;
        fromDate?: string;
      }
    >({
      query: ({ messId, ...body }) => ({
        url: messUrl(messId, "/bazar-duties/generate"),
        method: "POST",
        body,
      }),
      transformResponse: data<DutiesResponse>,
      invalidatesTags: (_r, _e, { messId }) => [dutiesTag(messId)],
    }),
    addDuty: build.mutation<BazarDuty, { messId: string; date: string; memberId: string }>({
      query: ({ messId, ...body }) => ({ url: messUrl(messId, "/bazar-duties"), method: "POST", body }),
      transformResponse: data<BazarDuty>,
      invalidatesTags: (_r, _e, { messId }) => [dutiesTag(messId)],
    }),
    updateDuty: build.mutation<
      BazarDuty,
      { messId: string; dutyId: string; date?: string; memberId?: string; isDone?: boolean }
    >({
      query: ({ messId, dutyId, ...body }) => ({
        url: messUrl(messId, `/bazar-duties/${dutyId}`),
        method: "PATCH",
        body,
      }),
      transformResponse: data<BazarDuty>,
      invalidatesTags: (_r, _e, { messId }) => [dutiesTag(messId)],
    }),
    swapDuties: build.mutation<BazarDuty[], { messId: string; dutyId: string; otherDutyId: string }>({
      query: ({ messId, ...body }) => ({ url: messUrl(messId, "/bazar-duties/swap"), method: "POST", body }),
      transformResponse: data<BazarDuty[]>,
      invalidatesTags: (_r, _e, { messId }) => [dutiesTag(messId)],
    }),
    removeDuty: build.mutation<void, { messId: string; dutyId: string }>({
      query: ({ messId, dutyId }) => ({ url: messUrl(messId, `/bazar-duties/${dutyId}`), method: "DELETE" }),
      transformResponse: () => undefined,
      invalidatesTags: (_r, _e, { messId }) => [dutiesTag(messId)],
    }),
  }),
});

export const {
  useBazarsInfiniteQuery,
  useBazarSummaryQuery,
  useCreateBazarMutation,
  useUpdateBazarMutation,
  useDeleteBazarMutation,
  useApproveBazarMutation,
  useRejectBazarMutation,
  useCreateUploadMutation,
  useBazarDutiesQuery,
  usePlanDutiesMutation,
  useAddDutyMutation,
  useUpdateDutyMutation,
  useSwapDutiesMutation,
  useRemoveDutyMutation,
} = bazarsApi;
