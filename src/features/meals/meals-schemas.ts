import { z } from "zod";

const date = z.string({ error: "Pick a date" }).min(1, "Pick a date");

export const mealOffSchema = z
  .object({
    memberId: z.string().optional(),
    fromDate: date,
    toDate: date,
    reason: z.string().trim().max(200, "Keep it under 200 characters"),
  })
  .refine((v) => v.fromDate <= v.toDate, {
    message: "The last day can't be before the first",
    path: ["toDate"],
  });

export type MealOffValues = z.infer<typeof mealOffSchema>;

export const mealRequestSchema = z.object({
  date,
  slotId: z.string(),
  request: z
    .string()
    .trim()
    .min(2, "Tell the managers what you'd like")
    .max(300, "Keep it under 300 characters"),
});

export type MealRequestValues = z.infer<typeof mealRequestSchema>;

export const menuSchema = z.object({
  items: z.string().trim().min(2, "What's cooking?").max(300, "Keep it under 300 characters"),
  note: z.string().trim().max(200, "Keep it under 200 characters"),
});

export type MenuValues = z.infer<typeof menuSchema>;
