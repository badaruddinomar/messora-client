import { z } from "zod";

// Mirrors the server's rules so most errors are caught before a request is made.
const phone = z
  .string()
  .trim()
  .min(1, "Enter your phone number")
  .regex(/^\+?[\d\s()-]{8,20}$/, "Enter a valid phone number");

// Trim before validating, so a pasted address with stray spaces still passes.
const email = z.string().trim().toLowerCase().pipe(z.email("Enter a valid email"));
const optionalEmail = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.union([z.literal(""), z.email("Enter a valid email")]));

const password = z.string().min(8, "Use at least 8 characters").max(72, "Use at most 72 characters");

const code = z
  .string()
  .trim()
  .regex(/^\d{6}$/, "Enter the 6-digit code");

export const loginSchema = z.object({
  identifier: z.string().trim().min(1, "Enter your phone number or email"),
  password: z.string().min(1, "Enter your password"),
});

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name").max(80),
  phone,
  email: optionalEmail,
  password,
});

export const verifyCodeSchema = z.object({ code });

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z
  .object({
    code,
    password,
    confirmPassword: z.string().min(1, "Confirm your new password"),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords don't match",
  });

export type LoginValues = z.infer<typeof loginSchema>;
export type RegisterValues = z.infer<typeof registerSchema>;
export type VerifyCodeValues = z.infer<typeof verifyCodeSchema>;
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
