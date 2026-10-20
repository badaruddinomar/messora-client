import { z } from "zod";
import { isMoney, sumMoney } from "@/lib/money";

export const expenseFormSchema = z
  .object({
    category: z.enum([
      "ELECTRICITY",
      "GAS",
      "WATER",
      "INTERNET",
      "COOK_SALARY",
      "MAID_SALARY",
      "CLEANING",
      "MAINTENANCE",
      "HOUSE_RENT",
      "UTENSILS",
      "OTHER",
    ]),
    title: z.string().trim().min(2, "Name the expense").max(80),
    amount: z.string().trim(),
    billDate: z.string().min(1, "Pick the bill's date"),
    splitType: z.enum(["EQUAL", "BY_MEAL", "CUSTOM"]),
    paidFrom: z.enum(["MESS_FUND", "OWN_POCKET"]),
    paidByMemberId: z.string(),
    /** CUSTOM only, keyed by member id. */
    shares: z.record(z.string(), z.string()),
  })
  .superRefine((v, ctx) => {
    const amountOk = isMoney(v.amount) && Number(v.amount) > 0;
    if (!amountOk) ctx.addIssue({ code: "custom", path: ["amount"], message: "Enter the amount" });
    if (v.paidFrom === "OWN_POCKET" && !v.paidByMemberId) {
      ctx.addIssue({ code: "custom", path: ["paidByMemberId"], message: "Say who paid" });
    }
    if (v.splitType === "CUSTOM" && amountOk) {
      const total = sumMoney(Object.values(v.shares));
      if (Number(total) !== Number(v.amount)) {
        ctx.addIssue({ code: "custom", path: ["shares"], message: "The shares must add up to the amount" });
      }
    }
  });

export type ExpenseFormValues = z.infer<typeof expenseFormSchema>;

export const chargeFormSchema = z
  .object({
    memberId: z.string().min(1, "Pick a member"),
    type: z.enum(["FINE", "PERSONAL", "ADJUSTMENT"]),
    /** Adjustments can take money off the bill instead of adding to it. */
    direction: z.enum(["charge", "credit"]),
    amount: z.string().trim(),
    description: z.string().trim().min(2, "Say what it's for").max(200),
  })
  .superRefine((v, ctx) => {
    if (!isMoney(v.amount) || Number(v.amount) <= 0) {
      ctx.addIssue({ code: "custom", path: ["amount"], message: "Enter the amount" });
    }
  });

export type ChargeFormValues = z.infer<typeof chargeFormSchema>;

export const staffFormSchema = z.object({
  name: z.string().trim().min(2, "Enter their name").max(60),
  phone: z
    .string()
    .trim()
    .refine((v) => v === "" || /^\+?[\d\s()-]{8,20}$/.test(v), "Enter a valid phone number"),
  role: z.enum(["COOK", "MAID", "GUARD", "OTHER"]),
  monthlySalary: z.string().refine((v) => isMoney(v) && Number(v) > 0, "Enter the monthly salary"),
});

export type StaffFormValues = z.infer<typeof staffFormSchema>;
