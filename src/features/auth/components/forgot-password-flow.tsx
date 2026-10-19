"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { parseAsString, parseAsStringLiteral, useQueryStates } from "nuqs";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { getErrorMessage } from "@/lib/api-error";
import { useForgotPasswordMutation, useResetPasswordMutation } from "../auth-api";
import {
  forgotPasswordSchema,
  resetPasswordSchema,
  type ForgotPasswordValues,
  type ResetPasswordValues,
} from "../schemas";

// The step and email live in the URL so a refresh doesn't lose progress.
const flowParams = {
  step: parseAsStringLiteral(["request", "reset"] as const).withDefault("request"),
  email: parseAsString.withDefault(""),
};

export function ForgotPasswordFlow() {
  const [{ step, email }, setFlow] = useQueryStates(flowParams);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold">Reset your password</h1>
        <p className="text-sm text-muted">
          {step === "request" ? "We'll email you a 6-digit code" : `Enter the code we sent to ${email}`}
        </p>
      </div>

      {step === "reset" && email ? (
        <ResetStep email={email} onChangeEmail={() => setFlow({ step: "request" })} />
      ) : (
        <RequestStep defaultEmail={email} onSent={(e) => setFlow({ step: "reset", email: e })} />
      )}

      <p className="text-center text-sm text-muted">
        <Link href="/login" className="font-medium text-primary hover:underline">
          Back to log in
        </Link>
      </p>
    </div>
  );
}

function RequestStep({ defaultEmail, onSent }: { defaultEmail: string; onSent: (email: string) => void }) {
  const [forgotPassword, { isLoading, error }] = useForgotPasswordMutation();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: defaultEmail },
  });

  const onSubmit = handleSubmit(async ({ email }) => {
    const res = await forgotPassword({ email });
    if (!res.error) onSent(email);
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      {error && <Alert>{getErrorMessage(error)}</Alert>}
      <Field label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register("email")} />
      <Button type="submit" loading={isLoading}>
        Send code
      </Button>
    </form>
  );
}

function ResetStep({ email, onChangeEmail }: { email: string; onChangeEmail: () => void }) {
  const router = useRouter();
  const [resetPassword, { isLoading, error }] = useResetPasswordMutation();
  const [resend, resendState] = useForgotPasswordMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { email },
  });

  const onSubmit = handleSubmit(async ({ code, password }) => {
    const res = await resetPassword({ email, code, password });
    if (!res.error) router.replace("/login?reset=true");
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      {error && <Alert>{getErrorMessage(error)}</Alert>}
      {resendState.isSuccess && <Alert tone="success">A new code is on its way.</Alert>}
      {resendState.error && <Alert>{getErrorMessage(resendState.error)}</Alert>}

      <Field
        label="6-digit code"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        error={errors.code?.message}
        {...register("code")}
      />
      <Field
        label="New password"
        type="password"
        autoComplete="new-password"
        error={errors.password?.message}
        {...register("password")}
      />
      <Field
        label="Confirm new password"
        type="password"
        autoComplete="new-password"
        error={errors.confirmPassword?.message}
        {...register("confirmPassword")}
      />

      <Button type="submit" loading={isLoading}>
        Update password
      </Button>

      <div className="flex justify-between text-xs">
        <button type="button" onClick={onChangeEmail} className="text-muted hover:underline">
          Use a different email
        </button>
        <button
          type="button"
          onClick={() => resend({ email })}
          disabled={resendState.isLoading}
          className="text-primary hover:underline disabled:opacity-60"
        >
          Resend code
        </button>
      </div>
    </form>
  );
}
