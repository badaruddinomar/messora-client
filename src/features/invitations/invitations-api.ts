import type { Mess, MessRole } from "@/features/messes/messes-types";
import { api, messUrl } from "@/store/api";
import type { ApiResponse } from "@/types/api";
import type { CreatedInvitation, Invitation, InvitationPreview } from "./invitations-types";

const sentTag = (messId: string) => ({ type: "Invitations" as const, id: messId });
const RECEIVED = { type: "Invitations" as const, id: "RECEIVED" };

export const invitationsApi = api.injectEndpoints({
  endpoints: (build) => ({
    // Mess side
    messInvitations: build.query<Invitation[], string>({
      query: (messId) => messUrl(messId, "/invitations"),
      transformResponse: (res: ApiResponse<Invitation[]>) => res.data,
      providesTags: (_r, _e, messId) => [sentTag(messId)],
    }),

    createInvitation: build.mutation<
      CreatedInvitation,
      { messId: string; email?: string; phone?: string; role: MessRole }
    >({
      query: ({ messId, ...body }) => ({ url: messUrl(messId, "/invitations"), method: "POST", body }),
      transformResponse: (res: ApiResponse<CreatedInvitation>) => res.data,
      invalidatesTags: (_r, _e, { messId }) => [sentTag(messId)],
    }),

    revokeInvitation: build.mutation<void, { messId: string; invitationId: string }>({
      query: ({ messId, invitationId }) => ({
        url: messUrl(messId, `/invitations/${invitationId}`),
        method: "DELETE",
      }),
      invalidatesTags: (_r, _e, { messId }) => [sentTag(messId)],
    }),

    // Invitee side
    invitationPreview: build.query<InvitationPreview, string>({
      query: (token) => `/invitations/${token}`,
      transformResponse: (res: ApiResponse<InvitationPreview>) => res.data,
    }),

    acceptInvitationLink: build.mutation<Mess, string>({
      query: (token) => ({ url: `/invitations/${token}/accept`, method: "POST" }),
      transformResponse: (res: ApiResponse<Mess>) => res.data,
      invalidatesTags: [{ type: "Mess", id: "LIST" }, RECEIVED],
    }),

    declineInvitationLink: build.mutation<void, string>({
      query: (token) => ({ url: `/invitations/${token}/decline`, method: "POST" }),
    }),

    receivedInvitations: build.query<Invitation[], void>({
      query: () => "/invitations/received",
      transformResponse: (res: ApiResponse<Invitation[]>) => res.data,
      providesTags: [RECEIVED],
    }),

    respondToInvitation: build.mutation<Mess | null, { invitationId: string; accept: boolean }>({
      query: ({ invitationId, accept }) => ({
        url: `/invitations/received/${invitationId}/${accept ? "accept" : "decline"}`,
        method: "POST",
      }),
      transformResponse: (res: ApiResponse<Mess | null>) => res.data,
      invalidatesTags: (_r, _e, { accept }) =>
        accept ? [{ type: "Mess", id: "LIST" }, RECEIVED] : [RECEIVED],
    }),
  }),
});

export const {
  useMessInvitationsQuery,
  useCreateInvitationMutation,
  useRevokeInvitationMutation,
  useInvitationPreviewQuery,
  useAcceptInvitationLinkMutation,
  useDeclineInvitationLinkMutation,
  useReceivedInvitationsQuery,
  useRespondToInvitationMutation,
} = invitationsApi;
