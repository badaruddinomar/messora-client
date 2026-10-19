"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { getErrorMessage } from "@/lib/api-error";
import { useAppSelector } from "@/store/hooks";
import { useSendEmailVerificationMutation, useVerifyEmailMutation } from "../auth-api";
import { selectUser } from "../auth-slice";
import { verifyCodeSchema, type VerifyCodeValues } from "../schemas";

export function VerifyEmailForm() {
  const router = useRouter();
  const user = useAppSelector(selectUser);
  const [verifyEmail, { isLoading, error }] = useVerifyEmailMutation();
  const [resend, resendState] = useSendEmailVerificationMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VerifyCodeValues>({ resolver: zodResolver(verifyCodeSchema) });

  if (!user?.email) {
    return <Alert tone="info">There&apos;s no email address on your account.</Alert>;
  }

  if (user.emailVerifiedAt) {
    return (
      <div className="flex flex-col gap-4">
        <Alert tone="success">{user.email} is verified.</Alert>
        <Link href="/dashboard" className="text-center text-sm font-medium text-primary hover:underline">
          Go to dashboard
        </Link>
      </div>
    );
  }

  const onSubmit = handleSubmit(async (values) => {
    const res = await verifyEmail(values);
    if (!res.error) router.replace("/dashboard");
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      <div>
        <h1 className="text-xl font-semibold">Verify your email</h1>
        <p className="text-sm text-muted">
          Enter the 6-digit code we sent to <span className="font-medium text-foreground">{user.email}</span>
        </p>
      </div>

      {error && <Alert>{getErrorMessage(error)}</Alert>}
      {resendState.isSuccess && <Alert tone="success">A new code is on its way.</Alert>}
      {resendState.error && <Alert>{getErrorMessage(resendState.error)}</Alert>}

      <Field
        label="Verification code"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        error={errors.code?.message}
        {...register("code")}
      />

      <Button type="submit" loading={isLoading}>
        Verify
      </Button>

      <div className="flex justify-between text-xs">
        <Link href="/dashboard" className="text-muted hover:underline">
          Skip for now
        </Link>
        <button
          type="button"
          onClick={() => resend()}
          disabled={resendState.isLoading}
          className="text-primary hover:underline disabled:opacity-60"
        >
          Resend code
        </button>
      </div>
    </form>
  );
}
