import { api, messUrl } from "@/store/api";
import type { ApiResponse, ApprovalStatus, Page } from "@/types/api";
import type { MealSlotInput } from "@/features/messes/messes-types";
import type {
  MealDay,
  MealEntryInput,
  MealOffPeriod,
  MealRequest,
  MealSlot,
  MemberMeals,
  MenuItem,
} from "./meals-types";
import { applyEntries } from "./utils";

const dayTag = (messId: string, date: string) => ({ type: "MealDay" as const, id: `${messId}:${date}` });
/** Everything that shows meal counts: every cached day sheet and calendar of the mess. */
const allMealTags = (messId: string) => [
  { type: "MealDay" as const, id: messId },
  { type: "MemberMeals" as const, id: messId },
];

const data = <T>(res: ApiResponse<T>) => res.data;

export const mealsApi = api.injectEndpoints({
  endpoints: (build) => ({
    // ---------- slots ----------
    mealSlots: build.query<MealSlot[], string>({
      query: (messId) => messUrl(messId, "/meal-slots"),
      transformResponse: data<MealSlot[]>,
      providesTags: (_r, _e, messId) => [{ type: "MealSlots", id: messId }],
    }),
    createMealSlot: build.mutation<MealSlot, { messId: string } & MealSlotInput>({
      query: ({ messId, ...body }) => ({ url: messUrl(messId, "/meal-slots"), method: "POST", body }),
      transformResponse: data<MealSlot>,
      invalidatesTags: (_r, _e, { messId }) => [{ type: "MealSlots", id: messId }, ...allMealTags(messId)],
    }),
    updateMealSlot: build.mutation<
      MealSlot,
      { messId: string; slotId: string } & Partial<MealSlotInput & { isActive: boolean; sortOrder: number }>
    >({
      query: ({ messId, slotId, ...body }) => ({
        url: messUrl(messId, `/meal-slots/${slotId}`),
        method: "PATCH",
        body,
      }),
      transformResponse: data<MealSlot>,
      invalidatesTags: (_r, _e, { messId }) => [{ type: "MealSlots", id: messId }, ...allMealTags(messId)],
    }),
    deleteMealSlot: build.mutation<{ archived: boolean }, { messId: string; slotId: string }>({
      query: ({ messId, slotId }) => ({ url: messUrl(messId, `/meal-slots/${slotId}`), method: "DELETE" }),
      transformResponse: data<{ archived: boolean }>,
      invalidatesTags: (_r, _e, { messId }) => [{ type: "MealSlots", id: messId }, ...allMealTags(messId)],
    }),

    // ---------- entries ----------
    mealDay: build.query<MealDay, { messId: string; date: string }>({
      query: ({ messId, date }) => ({ url: messUrl(messId, "/meals/day"), params: { date } }),
      transformResponse: data<MealDay>,
      providesTags: (_r, _e, { messId, date }) => [dayTag(messId, date), { type: "MealDay", id: messId }],
    }),
    memberMeals: build.query<MemberMeals, { messId: string; memberId: string; from: string; to: string }>({
      query: ({ messId, memberId, from, to }) => ({
        url: messUrl(messId, `/meals/members/${memberId}`),
        params: { from, to },
      }),
      transformResponse: data<MemberMeals>,
      providesTags: (_r, _e, { messId }) => [{ type: "MemberMeals", id: messId }],
    }),
    /**
     * Saves meals. Cached day sheets update instantly and roll back if the server says no
     * (DESIGN_SYSTEM §7); the caller shows the error.
     */
    saveMeals: build.mutation<unknown, { messId: string; entries: MealEntryInput[] }>({
      query: ({ messId, entries }) => ({ url: messUrl(messId, "/meals"), method: "PUT", body: { entries } }),
      transformResponse: data<unknown>,
      async onQueryStarted({ messId, entries }, { dispatch, queryFulfilled }) {
        const dates = [...new Set(entries.map((e) => e.date))];
        const patches = dates.map((date) =>
          dispatch(
            mealsApi.util.updateQueryData("mealDay", { messId, date }, (day) => applyEntries(day, entries)),
          ),
        );
        try {
          await queryFulfilled;
        } catch {
          patches.forEach((p) => p.undo());
        }
      },
      invalidatesTags: (_r, _e, { messId }) => [{ type: "MemberMeals", id: messId }],
    }),
    setUsualMeals: build.mutation<
      { defaultMealOn: boolean; updatedDays: number },
      { messId: string; defaultMealOn: boolean; memberId?: string }
    >({
      query: ({ messId, ...body }) => ({ url: messUrl(messId, "/meals/preference"), method: "PATCH", body }),
      transformResponse: data<{ defaultMealOn: boolean; updatedDays: number }>,
      invalidatesTags: (_r, _e, { messId }) => allMealTags(messId),
    }),

    // ---------- meal-off ----------
    mealOffPeriods: build.query<
      MealOffPeriod[],
      { messId: string; when?: "upcoming" | "past"; memberId?: string }
    >({
      query: ({ messId, ...params }) => ({ url: messUrl(messId, "/meals/off"), params }),
      transformResponse: data<MealOffPeriod[]>,
      providesTags: (_r, _e, { messId }) => [{ type: "MealOff", id: messId }],
    }),
    createMealOff: build.mutation<
      MealOffPeriod,
      { messId: string; memberId?: string; fromDate: string; toDate: string; reason?: string | null }
    >({
      query: ({ messId, ...body }) => ({ url: messUrl(messId, "/meals/off"), method: "POST", body }),
      transformResponse: data<MealOffPeriod>,
      invalidatesTags: (_r, _e, { messId }) => [{ type: "MealOff", id: messId }, ...allMealTags(messId)],
    }),
    deleteMealOff: build.mutation<{ ended: boolean }, { messId: string; periodId: string }>({
      query: ({ messId, periodId }) => ({ url: messUrl(messId, `/meals/off/${periodId}`), method: "DELETE" }),
      transformResponse: data<{ ended: boolean }>,
      invalidatesTags: (_r, _e, { messId }) => [{ type: "MealOff", id: messId }, ...allMealTags(messId)],
    }),

    // ---------- requests ----------
    mealRequests: build.query<Page<MealRequest>, { messId: string; status?: ApprovalStatus }>({
      query: ({ messId, status }) => ({
        url: messUrl(messId, "/meals/requests"),
        params: { limit: 50, ...(status && { status }) },
      }),
      transformResponse: data<Page<MealRequest>>,
      providesTags: (_r, _e, { messId }) => [{ type: "MealRequests", id: messId }],
    }),
    createMealRequest: build.mutation<
      MealRequest,
      { messId: string; date: string; slotId?: string | null; request: string }
    >({
      query: ({ messId, ...body }) => ({ url: messUrl(messId, "/meals/requests"), method: "POST", body }),
      transformResponse: data<MealRequest>,
      invalidatesTags: (_r, _e, { messId }) => [{ type: "MealRequests", id: messId }],
    }),
    respondToMealRequest: build.mutation<
      MealRequest,
      { messId: string; requestId: string; status: "APPROVED" | "REJECTED"; response?: string | null }
    >({
      query: ({ messId, requestId, ...body }) => ({
        url: messUrl(messId, `/meals/requests/${requestId}`),
        method: "PATCH",
        body,
      }),
      transformResponse: data<MealRequest>,
      invalidatesTags: (_r, _e, { messId }) => [{ type: "MealRequests", id: messId }],
    }),
    cancelMealRequest: build.mutation<void, { messId: string; requestId: string }>({
      query: ({ messId, requestId }) => ({
        url: messUrl(messId, `/meals/requests/${requestId}`),
        method: "DELETE",
      }),
      transformResponse: () => undefined,
      invalidatesTags: (_r, _e, { messId }) => [{ type: "MealRequests", id: messId }],
    }),

    // ---------- menu ----------
    saveMenu: build.mutation<
      MenuItem,
      { messId: string; date: string; slotId: string; items: string; note?: string | null }
    >({
      query: ({ messId, ...body }) => ({ url: messUrl(messId, "/meals/menu"), method: "PUT", body }),
      transformResponse: data<MenuItem>,
      invalidatesTags: (_r, _e, { messId, date }) => [dayTag(messId, date), { type: "Menu", id: messId }],
    }),
    deleteMenu: build.mutation<void, { messId: string; menuId: string; date: string }>({
      query: ({ messId, menuId }) => ({ url: messUrl(messId, `/meals/menu/${menuId}`), method: "DELETE" }),
      transformResponse: () => undefined,
      invalidatesTags: (_r, _e, { messId, date }) => [dayTag(messId, date), { type: "Menu", id: messId }],
    }),
  }),
});

export const {
  useMealSlotsQuery,
  useCreateMealSlotMutation,
  useUpdateMealSlotMutation,
  useDeleteMealSlotMutation,
  useMealDayQuery,
  useMemberMealsQuery,
  useSaveMealsMutation,
  useSetUsualMealsMutation,
  useMealOffPeriodsQuery,
  useCreateMealOffMutation,
  useDeleteMealOffMutation,
  useMealRequestsQuery,
  useCreateMealRequestMutation,
  useRespondToMealRequestMutation,
  useCancelMealRequestMutation,
  useSaveMenuMutation,
  useDeleteMenuMutation,
} = mealsApi;
