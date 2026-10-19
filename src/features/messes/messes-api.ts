import { api, messUrl } from "@/store/api";
import type { ApiResponse } from "@/types/api";
import type { CreateMessInput, Mess, MessSettings, UpdateMessInput } from "./messes-types";

const data = <T>(res: ApiResponse<T>) => res.data;

export const messesApi = api.injectEndpoints({
  endpoints: (build) => ({
    myMesses: build.query<Mess[], void>({
      query: () => "/messes",
      transformResponse: data<Mess[]>,
      providesTags: (messes) => [
        { type: "Mess", id: "LIST" },
        ...(messes ?? []).map((m) => ({ type: "Mess" as const, id: m.id })),
      ],
    }),

    createMess: build.mutation<Mess, CreateMessInput>({
      query: (body) => ({ url: "/messes", method: "POST", body }),
      transformResponse: data<Mess>,
      invalidatesTags: [{ type: "Mess", id: "LIST" }],
    }),

    updateMess: build.mutation<Mess, { messId: string } & UpdateMessInput>({
      query: ({ messId, ...body }) => ({ url: messUrl(messId), method: "PATCH", body }),
      transformResponse: data<Mess>,
      invalidatesTags: (_r, _e, { messId }) => [{ type: "Mess", id: messId }],
    }),

    deleteMess: build.mutation<void, { messId: string; confirmName: string }>({
      query: ({ messId, confirmName }) => ({ url: messUrl(messId), method: "DELETE", body: { confirmName } }),
      invalidatesTags: [{ type: "Mess", id: "LIST" }],
    }),

    regenerateJoinCode: build.mutation<Mess, string>({
      query: (messId) => ({ url: messUrl(messId, "/join-code"), method: "POST" }),
      transformResponse: data<Mess>,
      invalidatesTags: (_r, _e, messId) => [{ type: "Mess", id: messId }],
    }),

    messSettings: build.query<MessSettings, string>({
      query: (messId) => messUrl(messId, "/settings"),
      transformResponse: data<MessSettings>,
      providesTags: (_r, _e, messId) => [{ type: "MessSettings", id: messId }],
    }),

    updateMessSettings: build.mutation<MessSettings, { messId: string } & Partial<MessSettings>>({
      query: ({ messId, ...body }) => ({ url: messUrl(messId, "/settings"), method: "PATCH", body }),
      transformResponse: data<MessSettings>,
      // Write the saved settings straight into the cache so switches don't flicker.
      async onQueryStarted({ messId }, { dispatch, queryFulfilled }) {
        try {
          const { data: settings } = await queryFulfilled;
          dispatch(messesApi.util.upsertQueryData("messSettings", messId, settings));
        } catch {
          // The caller shows the error.
        }
      },
    }),

    joinMess: build.mutation<Mess, { joinCode: string }>({
      query: (body) => ({ url: "/messes/join", method: "POST", body }),
      transformResponse: data<Mess>,
      invalidatesTags: [{ type: "Mess", id: "LIST" }],
    }),

    cancelJoinRequest: build.mutation<void, string>({
      query: (messId) => ({ url: messUrl(messId, "/join-request"), method: "DELETE" }),
      invalidatesTags: [{ type: "Mess", id: "LIST" }],
    }),

    leaveMess: build.mutation<void, { messId: string; reason?: string }>({
      query: ({ messId, reason }) => ({ url: messUrl(messId, "/leave"), method: "POST", body: { reason } }),
      invalidatesTags: [{ type: "Mess", id: "LIST" }],
    }),
  }),
});

export const {
  useMyMessesQuery,
  useCreateMessMutation,
  useUpdateMessMutation,
  useDeleteMessMutation,
  useRegenerateJoinCodeMutation,
  useMessSettingsQuery,
  useUpdateMessSettingsMutation,
  useJoinMessMutation,
  useCancelJoinRequestMutation,
  useLeaveMessMutation,
} = messesApi;
