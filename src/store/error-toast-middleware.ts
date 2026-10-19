import { isRejectedWithValue, type Middleware } from "@reduxjs/toolkit";
import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/api-error";

/**
 * Shows a toast for failures the user can't fix from the form they're on: server errors and
 * lost connections. Validation and business-rule errors (4xx) are shown inline by the component.
 */
export const errorToastMiddleware: Middleware = () => (next) => (action) => {
  if (isRejectedWithValue(action)) {
    const error = action.payload as FetchBaseQueryError;
    const isServerError = typeof error.status === "number" && error.status >= 500;
    if (isServerError || error.status === "FETCH_ERROR" || error.status === "TIMEOUT_ERROR") {
      // A stable id stops a burst of failing requests from stacking identical toasts.
      toast.error(getErrorMessage(error), { id: `request-error-${error.status}` });
    }
  }
  return next(action);
};
