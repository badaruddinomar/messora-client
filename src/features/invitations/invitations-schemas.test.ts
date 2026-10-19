import { describe, expect, it } from "vitest";
import { inviteSchema } from "./invitations-schemas";

const base = { phone: "", email: "", role: "MEMBER" as const };

describe("inviteSchema", () => {
  it("only validates the chosen channel", () => {
    expect(
      inviteSchema.safeParse({ ...base, channel: "phone", phone: "01712345678", email: "junk" }).success,
    ).toBe(true);
    expect(
      inviteSchema.safeParse({ ...base, channel: "email", email: "a@example.com", phone: "x" }).success,
    ).toBe(true);
  });

  it("reports the error on the right field", () => {
    const phone = inviteSchema.safeParse({ ...base, channel: "phone", phone: "12" });
    expect(phone.error?.issues[0].path).toEqual(["phone"]);
    const email = inviteSchema.safeParse({ ...base, channel: "email", email: "nope" });
    expect(email.error?.issues[0].path).toEqual(["email"]);
  });
});
