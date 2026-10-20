export const ROUTES = {
  home: "/",
  login: "/login",
  register: "/register",
  forgotPassword: "/forgot-password",
  /** Smart entry point: opens the last-used mess, or the messes hub. */
  dashboard: "/dashboard",
  verifyEmail: "/verify-email",
  messes: "/messes",
  newMess: "/messes/new",
  join: "/join",
  invite: (token: string) => `/invite/${token}`,
} as const;

/** Mess-scoped pages live under /m/<slug>. */
export const messRoutes = (slug: string) => ({
  overview: `/m/${slug}`,
  meals: `/m/${slug}/meals`,
  bazar: `/m/${slug}/bazar`,
  deposits: `/m/${slug}/deposits`,
  expenses: `/m/${slug}/expenses`,
  rooms: `/m/${slug}/rooms`,
  members: `/m/${slug}/members`,
  months: `/m/${slug}/months`,
  month: (monthId: string) => `/m/${slug}/months/${monthId}`,
  /** A member's bill for a month; "me" for your own. */
  bill: (monthId: string, memberId = "me") => `/m/${slug}/months/${monthId}/bill/${memberId}`,
  settings: `/m/${slug}/settings`,
});

/** Where logged-in users land by default. */
export const DEFAULT_AUTHENTICATED_ROUTE = ROUTES.dashboard;
