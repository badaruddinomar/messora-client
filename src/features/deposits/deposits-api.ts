import { api, messUrl } from "@/store/api";
import type { ApiResponse, Page } from "@/types/api";
import type { Deposit, DepositFilters, DepositInput, DepositSummary } from "./deposits-types";

const data = <T>(res: ApiResponse<T>) => res.data;
/** Deposits change the month's balances, so the preview refreshes with them. */
const tags = (messId: string) => [
  { type: "Deposits" as const, id: messId },
  { type: "MonthPreview" as const, id: messId },
];

export const depositsApi = api.injectEndpoints({
  endpoints: (build) => ({
    /** Newest first, a page at a time. Members get their own; managers everyone's. */
    deposits: build.infiniteQuery<Page<Deposit>, { messId: string } & DepositFilters, string | null>({
      infiniteQueryOptions: { initialPageParam: null, getNextPageParam: (last) => last.nextCursor },
      query: ({ queryArg: { messId, ...filters }, pageParam }) => ({
        url: messUrl(messId, "/deposits"),
        params: { limit: 20, ...filters, ...(pageParam && { cursor: pageParam }) },
      }),
      transformResponse: data<Page<Deposit>>,
      providesTags: (_r, _e, { messId }) => [{ type: "Deposits", id: messId }],
    }),
    depositSummary: build.query<DepositSummary, { messId: string; monthId?: string }>({
      query: ({ messId, monthId }) => ({
        url: messUrl(messId, "/deposits/summary"),
        params: monthId ? { monthId } : {},
      }),
      transformResponse: data<DepositSummary>,
      providesTags: (_r, _e, { messId }) => [{ type: "Deposits", id: messId }],
    }),
    createDeposit: build.mutation<Deposit, { messId: string } & DepositInput>({
      query: ({ messId, ...body }) => ({ url: messUrl(messId, "/deposits"), method: "POST", body }),
      transformResponse: data<Deposit>,
      invalidatesTags: (_r, _e, { messId }) => tags(messId),
    }),
    updateDeposit: build.mutation<Deposit, { messId: string; depositId: string } & Partial<DepositInput>>({
      query: ({ messId, depositId, ...body }) => ({
        url: messUrl(messId, `/deposits/${depositId}`),
        method: "PATCH",
        body,
      }),
      transformResponse: data<Deposit>,
      invalidatesTags: (_r, _e, { messId }) => tags(messId),
    }),
    deleteDeposit: build.mutation<void, { messId: string; depositId: string }>({
      query: ({ messId, depositId }) => ({
        url: messUrl(messId, `/deposits/${depositId}`),
        method: "DELETE",
      }),
      transformResponse: () => undefined,
      invalidatesTags: (_r, _e, { messId }) => tags(messId),
    }),
    approveDeposit: build.mutation<Deposit, { messId: string; depositId: string }>({
      query: ({ messId, depositId }) => ({
        url: messUrl(messId, `/deposits/${depositId}/approve`),
        method: "POST",
      }),
      transformResponse: data<Deposit>,
      invalidatesTags: (_r, _e, { messId }) => tags(messId),
    }),
    rejectDeposit: build.mutation<Deposit, { messId: string; depositId: string; reason: string }>({
      query: ({ messId, depositId, reason }) => ({
        url: messUrl(messId, `/deposits/${depositId}/reject`),
        method: "POST",
        body: { reason },
      }),
      transformResponse: data<Deposit>,
      invalidatesTags: (_r, _e, { messId }) => tags(messId),
    }),
  }),
});

export const {
  useDepositsInfiniteQuery,
  useDepositSummaryQuery,
  useCreateDepositMutation,
  useUpdateDepositMutation,
  useDeleteDepositMutation,
  useApproveDepositMutation,
  useRejectDepositMutation,
} = depositsApi;
