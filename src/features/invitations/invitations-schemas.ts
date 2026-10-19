import { z } from "zod";

export const inviteSchema = z
  .object({
    channel: z.enum(["phone", "email"]),
    phone: z.string().trim(),
    email: z.string().trim().toLowerCase(),
    role: z.enum(["MEMBER", "MANAGER"]),
  })
  .superRefine((v, ctx) => {
    if (v.channel === "phone" && !/^\+?[\d\s()-]{8,20}$/.test(v.phone)) {
      ctx.addIssue({ code: "custom", path: ["phone"], message: "Enter a valid phone number" });
    }
    if (v.channel === "email" && !z.email().safeParse(v.email).success) {
      ctx.addIssue({ code: "custom", path: ["email"], message: "Enter a valid email" });
    }
  });

export type InviteValues = z.infer<typeof inviteSchema>;
