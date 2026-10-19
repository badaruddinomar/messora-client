import type { MemberStatus, MessRole } from "@/features/messes/messes-types";
import { api, messUrl } from "@/store/api";
import type { ApiResponse } from "@/types/api";
import type { Member } from "./members-types";

interface MemberArgs {
  messId: string;
  memberId: string;
}

/** One cache entry per (mess, status) list; any membership change refreshes the mess's lists. */
const membersTag = (messId: string) => ({ type: "Members" as const, id: messId });

export const membersApi = api.injectEndpoints({
  endpoints: (build) => ({
    members: build.query<Member[], { messId: string; status?: MemberStatus }>({
      query: ({ messId, status = "ACTIVE" }) => ({ url: messUrl(messId, "/members"), params: { status } }),
      transformResponse: (res: ApiResponse<Member[]>) => res.data,
      providesTags: (_r, _e, { messId }) => [membersTag(messId)],
    }),

    approveMember: build.mutation<Member, MemberArgs>({
      query: ({ messId, memberId }) => ({
        url: messUrl(messId, `/members/${memberId}/approve`),
        method: "POST",
      }),
      transformResponse: (res: ApiResponse<Member>) => res.data,
      invalidatesTags: (_r, _e, { messId }) => [membersTag(messId), { type: "Mess", id: messId }],
    }),

    rejectMember: build.mutation<void, MemberArgs>({
      query: ({ messId, memberId }) => ({
        url: messUrl(messId, `/members/${memberId}/reject`),
        method: "POST",
      }),
      invalidatesTags: (_r, _e, { messId }) => [membersTag(messId)],
    }),

    changeMemberRole: build.mutation<Member, MemberArgs & { role: MessRole }>({
      query: ({ messId, memberId, role }) => ({
        url: messUrl(messId, `/members/${memberId}/role`),
        method: "PATCH",
        body: { role },
      }),
      transformResponse: (res: ApiResponse<Member>) => res.data,
      invalidatesTags: (_r, _e, { messId }) => [membersTag(messId), { type: "Mess", id: messId }],
    }),

    setMemberSuspended: build.mutation<Member, MemberArgs & { suspended: boolean }>({
      query: ({ messId, memberId, suspended }) => ({
        url: messUrl(messId, `/members/${memberId}/${suspended ? "suspend" : "reactivate"}`),
        method: "POST",
      }),
      transformResponse: (res: ApiResponse<Member>) => res.data,
      invalidatesTags: (_r, _e, { messId }) => [membersTag(messId), { type: "Mess", id: messId }],
    }),

    removeMember: build.mutation<void, MemberArgs & { reason?: string }>({
      query: ({ messId, memberId, reason }) => ({
        url: messUrl(messId, `/members/${memberId}`),
        method: "DELETE",
        body: { reason },
      }),
      invalidatesTags: (_r, _e, { messId }) => [membersTag(messId), { type: "Mess", id: messId }],
    }),
  }),
});

export const {
  useMembersQuery,
  useApproveMemberMutation,
  useRejectMemberMutation,
  useChangeMemberRoleMutation,
  useSetMemberSuspendedMutation,
  useRemoveMemberMutation,
} = membersApi;
