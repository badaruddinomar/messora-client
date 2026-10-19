import { z } from "zod";

const time = z.union([z.literal(""), z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use a time like 10:30")]);

export const MEAL_WEIGHTS = ["0.25", "0.5", "0.75", "1", "1.5", "2"] as const;

export const mealSlotSchema = z.object({
  name: z.string().trim().min(1, "Name the meal").max(30),
  weight: z.enum(MEAL_WEIGHTS),
  cutoffTime: time,
});

export const messDetailsSchema = z.object({
  name: z.string().trim().min(2, "Use at least 2 characters").max(60),
  address: z.string().trim().max(200),
  gender: z.enum(["MALE", "FEMALE", "MIXED"]),
  monthStartDay: z.string().regex(/^([1-9]|1\d|2[0-8])$/, "Pick a day between 1 and 28"),
});

export const createMessSchema = messDetailsSchema.extend({
  mealSlots: z
    .array(mealSlotSchema)
    .min(1, "Add at least one meal")
    .max(6)
    .refine((slots) => new Set(slots.map((s) => s.name.trim().toLowerCase())).size === slots.length, {
      message: "Each meal needs a different name",
    }),
});

export const DEFAULT_MEAL_SLOTS: z.infer<typeof mealSlotSchema>[] = [
  { name: "Breakfast", weight: "0.5", cutoffTime: "07:00" },
  { name: "Lunch", weight: "1", cutoffTime: "10:00" },
  { name: "Dinner", weight: "1", cutoffTime: "17:00" },
];

export const joinMessSchema = z.object({
  joinCode: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9]{6,12}$/, "Join codes are 8 letters and numbers"),
});

export type MessDetailsValues = z.infer<typeof messDetailsSchema>;
export type CreateMessValues = z.infer<typeof createMessSchema>;
export type JoinMessValues = z.infer<typeof joinMessSchema>;
