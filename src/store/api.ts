import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import { loggedOut } from "@/features/auth/auth-slice";

const rawBaseQuery = fetchBaseQuery({
  baseUrl: "/api/v1",
  credentials: "include",
});

// Shared between concurrent requests so a burst of 401s triggers only one refresh call.
let refreshing: Promise<boolean> | null = null;

const NO_REFRESH = ["/auth/login", "/auth/register", "/auth/refresh", "/auth/logout"];

/** On 401, refreshes the session once and retries the original request. */
const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions,
) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  const url = typeof args === "string" ? args : args.url;
  if (result.error?.status !== 401 || NO_REFRESH.some((p) => url.startsWith(p))) return result;

  refreshing ??= Promise.resolve(rawBaseQuery({ url: "/auth/refresh", method: "POST" }, api, extraOptions))
    .then((r) => !r.error)
    .finally(() => {
      refreshing = null;
    });

  if (await refreshing) {
    result = await rawBaseQuery(args, api, extraOptions);
  } else {
    api.dispatch(loggedOut());
  }
  return result;
};

/**
 * Cache tags. Mutations invalidate exactly what they change, scoped by id
 * (`{ type: "Bazar", id }` plus `{ type: "Bazar", id: "LIST" }`), see FRONTEND_GUIDE §3.
 */
export const TAG_TYPES = [
  "Me",
  "Mess",
  "MessSettings",
  "Members",
  "Invitations",
  "Months",
  "MealSlots",
  "MealDay",
  "MemberMeals",
  "MealOff",
  "MealRequests",
  "Menu",
  "Bazars",
  "BazarDuties",
  "Deposits",
  "MonthPreview",
  "Expenses",
  "Charges",
  "Staff",
  "Rooms",
] as const;

/** Builds a mess-scoped endpoint path: `messUrl(messId, "/bazars")` → `/messes/<id>/bazars`. */
export const messUrl = (messId: string, path = "") => `/messes/${messId}${path}`;

/** Root API slice. Feature APIs add endpoints with `api.injectEndpoints`. */
export const api = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: TAG_TYPES,
  endpoints: () => ({}),
});
