import { describe, expect, it, vi } from "vitest";
import { applyFieldErrors, getErrorCode, getErrorMessage } from "./api-error";

const apiError = (status: number, body: object) => ({ status, data: { success: false, ...body } });

describe("getErrorMessage", () => {
  it("uses the API's message", () => {
    expect(
      getErrorMessage(apiError(401, { code: "INVALID_CREDENTIALS", message: "Invalid credentials" })),
    ).toBe("Invalid credentials");
  });

  it("explains network failures", () => {
    expect(getErrorMessage({ status: "FETCH_ERROR", error: "TypeError" })).toMatch(/can't reach the server/i);
  });

  it("falls back for unknown shapes", () => {
    expect(getErrorMessage({ status: 502, data: "<html>Bad gateway</html>" })).toMatch(
      /something went wrong/i,
    );
    expect(getErrorMessage(undefined, "Custom")).toBe("Custom");
  });
});

describe("getErrorCode", () => {
  it("returns the machine-readable code", () => {
    expect(getErrorCode(apiError(422, { code: "MONTH_CLOSED", message: "x" }))).toBe("MONTH_CLOSED");
    expect(getErrorCode({ status: "FETCH_ERROR", error: "x" })).toBeUndefined();
  });
});

describe("applyFieldErrors", () => {
  it("sets the first message of each field and reports whether any were applied", () => {
    const setError = vi.fn();
    const error = apiError(400, {
      code: "VALIDATION_ERROR",
      message: "Validation failed",
      details: { phone: ["Enter a valid phone number", "second"], email: [] },
    });

    expect(applyFieldErrors(error, setError)).toBe(true);
    expect(setError).toHaveBeenCalledTimes(1);
    expect(setError).toHaveBeenCalledWith("phone", { type: "server", message: "Enter a valid phone number" });

    expect(applyFieldErrors(apiError(409, { code: "CONFLICT", message: "Exists" }), setError)).toBe(false);
  });
});
