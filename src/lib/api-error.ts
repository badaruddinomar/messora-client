import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import type { SerializedError } from "@reduxjs/toolkit";
import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import type { ApiErrorBody, ApiErrorCode } from "@/types/api";

export type RequestError = FetchBaseQueryError | SerializedError | undefined;

function isApiErrorBody(data: unknown): data is ApiErrorBody {
  return typeof data === "object" && data !== null && "message" in data;
}

const bodyOf = (error: RequestError) =>
  error && "status" in error && isApiErrorBody(error.data) ? error.data : undefined;

/** Turns an RTK Query error into a message that can be shown to the user. */
export function getErrorMessage(error: RequestError, fallback = "Something went wrong. Please try again.") {
  if (!error) return fallback;
  const body = bodyOf(error);
  if (body) return body.message;
  if ("status" in error && error.status === "FETCH_ERROR")
    return "Can't reach the server. Check your connection.";
  return fallback;
}

/** The machine-readable error code from the API, for branching on specific failures. */
export const getErrorCode = (error: RequestError): ApiErrorCode | undefined => bodyOf(error)?.code;

/** Field-level validation errors returned by the API (Zod `fieldErrors`). */
export const getFieldErrors = (error: RequestError) => bodyOf(error)?.details ?? {};

/**
 * Shows the API's field errors on the matching form fields.
 * Returns true if any were applied, so the caller can skip the generic error alert.
 */
export function applyFieldErrors<T extends FieldValues>(error: RequestError, setError: UseFormSetError<T>) {
  const entries = Object.entries(getFieldErrors(error)).filter(([, messages]) => messages?.length);
  for (const [field, messages] of entries) {
    setError(field as Path<T>, { type: "server", message: messages![0] });
  }
  return entries.length > 0;
}
