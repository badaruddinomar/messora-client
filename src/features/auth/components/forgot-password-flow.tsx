"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { parseAsString, parseAsStringLiteral, useQueryStates } from "nuqs";
import { ArrowLeft, CircleAlert } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { InputOTP } from "@/components/ui/input-otp";
import { PasswordInput } from "@/components/ui/password-input";
import { ROUTES } from "@/constants/routes";
import { getErrorMessage } from "@/lib/api-error";
import { useForgotPasswordMutation, useResetPasswordMutation } from "../auth-api";
import {
  forgotPasswordSchema,
  resetPasswordSchema,
  type ForgotPasswordValues,
  type ResetPasswordValues,
} from "../auth-schemas";
import { AuthHeading } from "./auth-heading";
import { ResendCodeButton } from "./resend-code-button";

// The step and email live in the URL so a refresh doesn't lose progress.
const flowParams = {
  step: parseAsStringLiteral(["request", "reset"] as const).withDefault("request"),
  email: parseAsString.withDefault(""),
};

export function ForgotPasswordFlow() {
  const [{ step, email }, setFlow] = useQueryStates(flowParams);
  const onResetStep = step === "reset" && !!email;

  return (
    <>
      <AuthHeading
        title={onResetStep ? "Check your email" : "Reset your password"}
        description={
          onResetStep ? (
            <>
              Enter the 6-digit code we sent to <span className="font-medium text-foreground">{email}</span>.
            </>
          ) : (
            "Enter the email on your account and we'll send you a code."
          )
        }
      />

      {/* Keyed by step so each step mounts fresh and animates in. */}
      <div
        key={onResetStep ? "reset" : "request"}
        className="animate-in duration-200 fade-in-0 slide-in-from-right-2"
      >
        {onResetStep ? (
          <ResetStep email={email} onChangeEmail={() => setFlow({ step: "request" })} />
        ) : (
          <RequestStep defaultEmail={email} onSent={(e) => setFlow({ step: "reset", email: e })} />
        )}
      </div>

      <Button variant="link" asChild className="mt-8 self-center text-muted-foreground hover:text-foreground">
        <Link href={ROUTES.login}>
          <ArrowLeft />
          Back to log in
        </Link>
      </Button>
    </>
  );
}

function RequestStep({ defaultEmail, onSent }: { defaultEmail: string; onSent: (email: string) => void }) {
  const [forgotPassword, { isLoading, error }] = useForgotPasswordMutation();
  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: defaultEmail },
  });

  const onSubmit = form.handleSubmit(async ({ email }) => {
    const res = await forgotPassword({ email });
    if (!res.error) onSent(email);
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="grid gap-5" noValidate>
        {error && (
          <Alert variant="destructive">
            <CircleAlert />
            <AlertDescription>{getErrorMessage(error)}</AlertDescription>
          </Alert>
        )}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" autoComplete="email" autoFocus placeholder="you@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" size="lg" loading={isLoading}>
          Send code
        </Button>
      </form>
    </Form>
  );
}

function ResetStep({ email, onChangeEmail }: { email: string; onChangeEmail: () => void }) {
  const router = useRouter();
  const [resetPassword, { isLoading, error }] = useResetPasswordMutation();
  const [resend, resendState] = useForgotPasswordMutation();

  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { code: "", password: "", confirmPassword: "" },
  });

  const onSubmit = form.handleSubmit(async ({ code, password }) => {
    const res = await resetPassword({ email, code, password });
    if (!res.error) {
      toast.success("Password updated");
      router.replace(`${ROUTES.login}?reset=true`);
    }
  });

  const requestError = error ?? resendState.error;

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="grid gap-5" noValidate>
        {requestError && (
          <Alert variant="destructive">
            <CircleAlert />
            <AlertDescription>{getErrorMessage(requestError)}</AlertDescription>
          </Alert>
        )}

        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Code</FormLabel>
              <FormControl>
                <InputOTP autoFocus {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>New password</FormLabel>
              <FormControl>
                <PasswordInput autoComplete="new-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm new password</FormLabel>
              <FormControl>
                <PasswordInput autoComplete="new-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" size="lg" loading={isLoading}>
          Update password
        </Button>

        <div className="flex items-center justify-between text-sm">
          <Button
            type="button"
            variant="link"
            className="text-muted-foreground hover:text-foreground"
            onClick={onChangeEmail}
          >
            Use a different email
          </Button>
          <ResendCodeButton onResend={() => resend({ email }).unwrap()} />
        </div>
      </form>
    </Form>
  );
}
