import { z } from "zod";
import { isMoney } from "@/lib/money";

export const depositFormSchema = z
  .object({
    date: z.string().min(1, "Pick the day"),
    memberId: z.string(),
    amount: z.string().trim(),
    method: z.enum(["CASH", "BKASH", "NAGAD", "ROCKET", "BANK", "OTHER"]),
    transactionRef: z.string().trim().max(60, "Keep it under 60 characters"),
    note: z.string().trim().max(300, "Keep it under 300 characters"),
  })
  .superRefine((v, ctx) => {
    if (!isMoney(v.amount) || Number(v.amount) <= 0) {
      ctx.addIssue({ code: "custom", path: ["amount"], message: "Enter how much was paid" });
    }
  });

export type DepositFormValues = z.infer<typeof depositFormSchema>;
