export const ROUTES = {
  home: "/",
  login: "/login",
  register: "/register",
  forgotPassword: "/forgot-password",
  dashboard: "/dashboard",
  verifyEmail: "/verify-email",
} as const;

/** Where logged-in users land by default. */
export const DEFAULT_AUTHENTICATED_ROUTE = ROUTES.dashboard;
