import { api } from "@/store/api";
import type { ApiResponse } from "@/types/api";
import type { User } from "@/types/user";
import { loggedOut, userSet } from "./auth-slice";
import type { ForgotPasswordValues, LoginValues, RegisterValues } from "./auth-schemas";

type SessionResponse = ApiResponse<{ user: User; accessToken: string }>;
type MessageResponse = ApiResponse<null>;

/** Stores the returned user in the auth slice once the request succeeds. */
async function syncUser<T>(
  queryFulfilled: Promise<{ data: T }>,
  dispatch: (action: unknown) => unknown,
  pick: (data: T) => User,
) {
  try {
    const { data } = await queryFulfilled;
    dispatch(userSet(pick(data)));
  } catch {
    // Errors are shown by the calling component.
  }
}

export const authApi = api.injectEndpoints({
  endpoints: (build) => ({
    me: build.query<User, void>({
      query: () => "/auth/me",
      transformResponse: (res: ApiResponse<User>) => res.data,
      providesTags: ["Me"],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(userSet(data));
        } catch {
          dispatch(loggedOut());
        }
      },
    }),

    login: build.mutation<SessionResponse, LoginValues>({
      query: (body) => ({ url: "/auth/login", method: "POST", body }),
      onQueryStarted: (_arg, { dispatch, queryFulfilled }) =>
        syncUser(queryFulfilled, dispatch, (res) => res.data.user),
    }),

    register: build.mutation<SessionResponse, RegisterValues>({
      query: ({ email, ...rest }) => ({
        url: "/auth/register",
        method: "POST",
        body: { ...rest, ...(email ? { email } : {}) },
      }),
      onQueryStarted: (_arg, { dispatch, queryFulfilled }) =>
        syncUser(queryFulfilled, dispatch, (res) => res.data.user),
    }),

    logout: build.mutation<MessageResponse, void>({
      query: () => ({ url: "/auth/logout", method: "POST" }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        await queryFulfilled.catch(() => undefined);
        dispatch(loggedOut());
        dispatch(api.util.resetApiState());
      },
    }),

    sendEmailVerification: build.mutation<MessageResponse, void>({
      query: () => ({ url: "/auth/email/send-verification", method: "POST" }),
    }),

    verifyEmail: build.mutation<ApiResponse<User>, { code: string }>({
      query: (body) => ({ url: "/auth/email/verify", method: "POST", body }),
      onQueryStarted: (_arg, { dispatch, queryFulfilled }) =>
        syncUser(queryFulfilled, dispatch, (res) => res.data),
    }),

    forgotPassword: build.mutation<MessageResponse, ForgotPasswordValues>({
      query: (body) => ({ url: "/auth/password/forgot", method: "POST", body }),
    }),

    resetPassword: build.mutation<MessageResponse, { email: string; code: string; password: string }>({
      query: (body) => ({ url: "/auth/password/reset", method: "POST", body }),
    }),
  }),
});

export const {
  useMeQuery,
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useSendEmailVerificationMutation,
  useVerifyEmailMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
} = authApi;
