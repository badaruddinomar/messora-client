import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import type { SerializedError } from "@reduxjs/toolkit";
import type { ApiErrorBody } from "@/types/api";

function isApiErrorBody(data: unknown): data is ApiErrorBody {
  return typeof data === "object" && data !== null && "message" in data;
}

/** Turns an RTK Query error into a message that can be shown to the user. */
export function getErrorMessage(error: FetchBaseQueryError | SerializedError | undefined, fallback = "Something went wrong") {
  if (!error) return fallback;
  if ("status" in error) {
    if (isApiErrorBody(error.data)) return error.data.message;
    if (error.status === "FETCH_ERROR") return "Can't reach the server. Check your connection.";
    return fallback;
  }
  return error.message ?? fallback;
}

/** Field-level validation errors returned by the API (Zod `fieldErrors`). */
export function getFieldErrors(error: FetchBaseQueryError | SerializedError | undefined) {
  if (error && "status" in error && isApiErrorBody(error.data)) return error.data.details ?? {};
  return {};
}
