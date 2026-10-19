import { describe, expect, it } from "vitest";
import { forgotPasswordSchema, registerSchema, resetPasswordSchema } from "./auth-schemas";
import { safeNext } from "./utils";

describe("registerSchema", () => {
  const valid = { name: "Rahim Uddin", phone: "01712345678", email: "", password: "password123" };

  it("accepts an empty optional email", () => {
    expect(registerSchema.safeParse(valid).success).toBe(true);
  });

  it("trims and lowercases the email before validating", () => {
    const parsed = registerSchema.parse({ ...valid, email: "  Rahim@Example.com " });
    expect(parsed.email).toBe("rahim@example.com");
  });

  it("rejects short passwords and bad phones", () => {
    const result = registerSchema.safeParse({ ...valid, phone: "12", password: "short" });
    expect(result.success).toBe(false);
    const fields = result.error?.issues.map((i) => i.path[0]);
    expect(fields).toEqual(expect.arrayContaining(["phone", "password"]));
  });
});

describe("forgotPasswordSchema", () => {
  it("requires a valid email", () => {
    expect(forgotPasswordSchema.safeParse({ email: "nope" }).success).toBe(false);
  });
});

describe("resetPasswordSchema", () => {
  it("requires matching passwords and a 6-digit code", () => {
    const result = resetPasswordSchema.safeParse({
      code: "12a456",
      password: "password123",
      confirmPassword: "other",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues.map((i) => i.path[0]).sort()).toEqual(["code", "confirmPassword"]);
  });
});

describe("safeNext", () => {
  it.each([
    ["/dashboard", "/dashboard"],
    ["/verify-email?x=1", "/verify-email?x=1"],
    ["//evil.com", null],
    ["https://evil.com", null],
    [null, null],
  ])("%s → %s", (input, expected) => {
    expect(safeNext(input)).toBe(expected);
  });
});
