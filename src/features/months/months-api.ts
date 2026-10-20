import { api, messUrl } from "@/store/api";
import type { ApiResponse } from "@/types/api";
import type {
  CloseCheck,
  Handover,
  Month,
  MonthPreview,
  PaymentMethod,
  Settlements,
  SettlementRow,
  Statement,
} from "./months-types";

const monthsTag = (messId: string) => ({ type: "Months" as const, id: messId });

export const monthsApi = api.injectEndpoints({
  endpoints: (build) => ({
    /** All billing months, newest first. Fetching it also opens the current month on the server. */
    months: build.query<Month[], string>({
      query: (messId) => messUrl(messId, "/months"),
      transformResponse: (res: ApiResponse<Month[]>) => res.data,
      providesTags: (_r, _e, messId) => [monthsTag(messId)],
    }),

    /** The month so far: meal rate and everyone's running balance (an estimate until it's closed). */
    monthPreview: build.query<MonthPreview, { messId: string; monthId: string }>({
      query: ({ messId, monthId }) => messUrl(messId, `/months/${monthId}/preview`),
      transformResponse: (res: ApiResponse<MonthPreview>) => res.data,
      providesTags: (_r, _e, { messId }) => [{ type: "MonthPreview", id: messId }],
    }),

    statement: build.query<Statement, { messId: string; monthId: string; memberId: string }>({
      query: ({ messId, monthId, memberId }) => messUrl(messId, `/months/${monthId}/statement/${memberId}`),
      transformResponse: (res: ApiResponse<Statement>) => res.data,
      providesTags: (_r, _e, { messId }) => [
        { type: "MonthPreview", id: messId },
        { type: "Settlements", id: messId },
      ],
    }),

    // ---------- closing ----------
    closeCheck: build.query<CloseCheck, { messId: string; monthId: string }>({
      query: ({ messId, monthId }) => messUrl(messId, `/months/${monthId}/close-check`),
      transformResponse: (res: ApiResponse<CloseCheck>) => res.data,
      providesTags: (_r, _e, { messId }) => [monthsTag(messId), { type: "MonthPreview", id: messId }],
    }),
    startClosing: build.mutation<Month, { messId: string; monthId: string }>({
      query: ({ messId, monthId }) => ({
        url: messUrl(messId, `/months/${monthId}/start-closing`),
        method: "POST",
      }),
      transformResponse: (res: ApiResponse<Month>) => res.data,
      invalidatesTags: (_r, _e, { messId }) => [monthsTag(messId), { type: "MonthPreview", id: messId }],
    }),
    reopenMonth: build.mutation<Month, { messId: string; monthId: string }>({
      query: ({ messId, monthId }) => ({ url: messUrl(messId, `/months/${monthId}/reopen`), method: "POST" }),
      transformResponse: (res: ApiResponse<Month>) => res.data,
      invalidatesTags: (_r, _e, { messId }) => [monthsTag(messId), { type: "MonthPreview", id: messId }],
    }),
    closeMonth: build.mutation<Month, { messId: string; monthId: string; version: number }>({
      query: ({ messId, monthId, version }) => ({
        url: messUrl(messId, `/months/${monthId}/close`),
        method: "POST",
        body: { version },
      }),
      transformResponse: (res: ApiResponse<Month>) => res.data,
      invalidatesTags: (_r, _e, { messId }) => [
        monthsTag(messId),
        { type: "MonthPreview", id: messId },
        { type: "Settlements", id: messId },
        { type: "Charges", id: messId },
        { type: "Mess", id: "LIST" },
      ],
    }),

    // ---------- settling up ----------
    settlements: build.query<Settlements, { messId: string; monthId: string }>({
      query: ({ messId, monthId }) => messUrl(messId, `/months/${monthId}/settlements`),
      transformResponse: (res: ApiResponse<Settlements>) => res.data,
      providesTags: (_r, _e, { messId }) => [{ type: "Settlements", id: messId }],
    }),
    recordSettlement: build.mutation<
      SettlementRow,
      {
        messId: string;
        monthId: string;
        memberId: string;
        amount: string;
        method: PaymentMethod;
        transactionRef?: string | null;
        note?: string | null;
        date?: string;
      }
    >({
      query: ({ messId, monthId, ...body }) => ({
        url: messUrl(messId, `/months/${monthId}/settlements`),
        method: "POST",
        body,
      }),
      transformResponse: (res: ApiResponse<SettlementRow>) => res.data,
      invalidatesTags: (_r, _e, { messId }) => [
        { type: "Settlements", id: messId },
        { type: "MonthPreview", id: messId },
      ],
    }),
    deleteSettlement: build.mutation<void, { messId: string; settlementId: string }>({
      query: ({ messId, settlementId }) => ({
        url: messUrl(messId, `/settlements/${settlementId}`),
        method: "DELETE",
      }),
      transformResponse: () => undefined,
      invalidatesTags: (_r, _e, { messId }) => [
        { type: "Settlements", id: messId },
        { type: "MonthPreview", id: messId },
      ],
    }),
    handovers: build.query<Handover[], { messId: string; monthId: string }>({
      query: ({ messId, monthId }) => messUrl(messId, `/months/${monthId}/handovers`),
      transformResponse: (res: ApiResponse<Handover[]>) => res.data,
      providesTags: (_r, _e, { messId }) => [{ type: "Handovers", id: messId }],
    }),
    createHandover: build.mutation<
      Handover,
      { messId: string; monthId: string; toMemberId: string; handedAmount: string; note?: string | null }
    >({
      query: ({ messId, monthId, ...body }) => ({
        url: messUrl(messId, `/months/${monthId}/handovers`),
        method: "POST",
        body,
      }),
      transformResponse: (res: ApiResponse<Handover>) => res.data,
      invalidatesTags: (_r, _e, { messId }) => [{ type: "Handovers", id: messId }],
    }),
    respondToHandover: build.mutation<
      Handover,
      { messId: string; handoverId: string; status: "CONFIRMED" | "DISPUTED"; note?: string | null }
    >({
      query: ({ messId, handoverId, ...body }) => ({
        url: messUrl(messId, `/handovers/${handoverId}/respond`),
        method: "POST",
        body,
      }),
      transformResponse: (res: ApiResponse<Handover>) => res.data,
      invalidatesTags: (_r, _e, { messId }) => [{ type: "Handovers", id: messId }],
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

export const {
  useMonthsQuery,
  useMonthPreviewQuery,
  useStatementQuery,
  useCloseCheckQuery,
  useStartClosingMutation,
  useReopenMonthMutation,
  useCloseMonthMutation,
  useSettlementsQuery,
  useRecordSettlementMutation,
  useDeleteSettlementMutation,
  useHandoversQuery,
  useCreateHandoverMutation,
  useRespondToHandoverMutation,
  useSetMonthManagerMutation,
} = monthsApi;
