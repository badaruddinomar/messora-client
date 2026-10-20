import { api, messUrl } from "@/store/api";
import type { ApiResponse, Page } from "@/types/api";
import type {
  Charge,
  ChargeType,
  Expense,
  ExpenseCategory,
  ExpenseDetail,
  ExpenseInput,
  ExpenseSummary,
  SplitPreview,
  SplitType,
  Staff,
  StaffInput,
} from "./expenses-types";
import type { PaidFrom } from "@/features/bazars/bazars-types";

const data = <T>(res: ApiResponse<T>) => res.data;
const preview = (messId: string) => ({ type: "MonthPreview" as const, id: messId });
const expensesTags = (messId: string) => [{ type: "Expenses" as const, id: messId }, preview(messId)];
const chargesTags = (messId: string) => [{ type: "Charges" as const, id: messId }, preview(messId)];

type ExpensePage = Page<Expense> & { monthId: string };

export const expensesApi = api.injectEndpoints({
  endpoints: (build) => ({
    expenses: build.infiniteQuery<
      ExpensePage,
      { messId: string; monthId?: string; category?: ExpenseCategory },
      string | null
    >({
      infiniteQueryOptions: { initialPageParam: null, getNextPageParam: (last) => last.nextCursor },
      query: ({ queryArg: { messId, ...filters }, pageParam }) => ({
        url: messUrl(messId, "/expenses"),
        params: { limit: 20, ...filters, ...(pageParam && { cursor: pageParam }) },
      }),
      transformResponse: data<ExpensePage>,
      providesTags: (_r, _e, { messId }) => [{ type: "Expenses", id: messId }],
    }),
    expense: build.query<ExpenseDetail, { messId: string; expenseId: string }>({
      query: ({ messId, expenseId }) => messUrl(messId, `/expenses/${expenseId}`),
      transformResponse: data<ExpenseDetail>,
      providesTags: (_r, _e, { messId }) => [{ type: "Expenses", id: messId }],
    }),
    expenseSummary: build.query<ExpenseSummary, { messId: string; monthId?: string }>({
      query: ({ messId, monthId }) => ({
        url: messUrl(messId, "/expenses/summary"),
        params: monthId ? { monthId } : {},
      }),
      transformResponse: data<ExpenseSummary>,
      providesTags: (_r, _e, { messId }) => [{ type: "Expenses", id: messId }],
    }),
    splitPreview: build.query<
      SplitPreview,
      { messId: string; billDate: string; amount: string; splitType: Exclude<SplitType, "CUSTOM"> }
    >({
      query: ({ messId, ...body }) => ({
        url: messUrl(messId, "/expenses/split-preview"),
        method: "POST",
        body,
      }),
      transformResponse: data<SplitPreview>,
    }),
    createExpense: build.mutation<Expense, { messId: string } & ExpenseInput>({
      query: ({ messId, ...body }) => ({ url: messUrl(messId, "/expenses"), method: "POST", body }),
      transformResponse: data<Expense>,
      invalidatesTags: (_r, _e, { messId }) => expensesTags(messId),
    }),
    updateExpense: build.mutation<Expense, { messId: string; expenseId: string } & Partial<ExpenseInput>>({
      query: ({ messId, expenseId, ...body }) => ({
        url: messUrl(messId, `/expenses/${expenseId}`),
        method: "PATCH",
        body,
      }),
      transformResponse: data<Expense>,
      invalidatesTags: (_r, _e, { messId }) => expensesTags(messId),
    }),
    deleteExpense: build.mutation<void, { messId: string; expenseId: string }>({
      query: ({ messId, expenseId }) => ({
        url: messUrl(messId, `/expenses/${expenseId}`),
        method: "DELETE",
      }),
      transformResponse: () => undefined,
      invalidatesTags: (_r, _e, { messId }) => expensesTags(messId),
    }),
    payStaff: build.mutation<
      Expense,
      {
        messId: string;
        staffId: string;
        amount?: string;
        billDate: string;
        splitType: SplitType;
        paidFrom: PaidFrom;
        paidByMemberId?: string | null;
        again?: boolean;
      }
    >({
      query: ({ messId, ...body }) => ({ url: messUrl(messId, "/expenses/pay-staff"), method: "POST", body }),
      transformResponse: data<Expense>,
      invalidatesTags: (_r, _e, { messId }) => [...expensesTags(messId), { type: "Staff", id: messId }],
    }),

    // ---------- staff ----------
    staff: build.query<Staff[], { messId: string; monthId?: string }>({
      query: ({ messId, monthId }) => ({
        url: messUrl(messId, "/staff"),
        params: monthId ? { monthId } : {},
      }),
      transformResponse: data<Staff[]>,
      providesTags: (_r, _e, { messId }) => [{ type: "Staff", id: messId }],
    }),
    createStaff: build.mutation<Staff, { messId: string } & StaffInput>({
      query: ({ messId, ...body }) => ({ url: messUrl(messId, "/staff"), method: "POST", body }),
      transformResponse: data<Staff>,
      invalidatesTags: (_r, _e, { messId }) => [{ type: "Staff", id: messId }],
    }),
    updateStaff: build.mutation<
      Staff,
      { messId: string; staffId: string } & Partial<StaffInput & { isActive: boolean }>
    >({
      query: ({ messId, staffId, ...body }) => ({
        url: messUrl(messId, `/staff/${staffId}`),
        method: "PATCH",
        body,
      }),
      transformResponse: data<Staff>,
      invalidatesTags: (_r, _e, { messId }) => [{ type: "Staff", id: messId }],
    }),
    deleteStaff: build.mutation<{ deactivated: boolean }, { messId: string; staffId: string }>({
      query: ({ messId, staffId }) => ({ url: messUrl(messId, `/staff/${staffId}`), method: "DELETE" }),
      transformResponse: data<{ deactivated: boolean }>,
      invalidatesTags: (_r, _e, { messId }) => [{ type: "Staff", id: messId }],
    }),

    // ---------- charges ----------
    charges: build.query<
      { monthId: string; total: string; items: Charge[] },
      { messId: string; monthId?: string; memberId?: string }
    >({
      query: ({ messId, ...params }) => ({ url: messUrl(messId, "/charges"), params }),
      transformResponse: data<{ monthId: string; total: string; items: Charge[] }>,
      providesTags: (_r, _e, { messId }) => [{ type: "Charges", id: messId }],
    }),
    createCharge: build.mutation<
      Charge,
      {
        messId: string;
        monthId?: string;
        memberId: string;
        type: Exclude<ChargeType, "SEAT_RENT">;
        amount: string;
        description: string;
      }
    >({
      query: ({ messId, ...body }) => ({ url: messUrl(messId, "/charges"), method: "POST", body }),
      transformResponse: data<Charge>,
      invalidatesTags: (_r, _e, { messId }) => chargesTags(messId),
    }),
    updateCharge: build.mutation<
      Charge,
      { messId: string; chargeId: string; amount?: string; description?: string }
    >({
      query: ({ messId, chargeId, ...body }) => ({
        url: messUrl(messId, `/charges/${chargeId}`),
        method: "PATCH",
        body,
      }),
      transformResponse: data<Charge>,
      invalidatesTags: (_r, _e, { messId }) => chargesTags(messId),
    }),
    deleteCharge: build.mutation<void, { messId: string; chargeId: string }>({
      query: ({ messId, chargeId }) => ({ url: messUrl(messId, `/charges/${chargeId}`), method: "DELETE" }),
      transformResponse: () => undefined,
      invalidatesTags: (_r, _e, { messId }) => chargesTags(messId),
    }),
  }),
});

export const {
  useExpensesInfiniteQuery,
  useExpenseQuery,
  useExpenseSummaryQuery,
  useSplitPreviewQuery,
  useCreateExpenseMutation,
  useUpdateExpenseMutation,
  useDeleteExpenseMutation,
  usePayStaffMutation,
  useStaffQuery,
  useCreateStaffMutation,
  useUpdateStaffMutation,
  useDeleteStaffMutation,
  useChargesQuery,
  useCreateChargeMutation,
  useUpdateChargeMutation,
  useDeleteChargeMutation,
} = expensesApi;
