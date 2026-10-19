"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { parseAsBoolean, useQueryState } from "nuqs";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { getErrorMessage } from "@/lib/api-error";
import { useLoginMutation } from "../auth-api";
import { loginSchema, type LoginValues } from "../auth-schemas";
import { ROUTES } from "@/constants/routes";

export function LoginForm() {
  const [login, { isLoading, error }] = useLoginMutation();
  // Set by the reset-password flow to show a confirmation here.
  const [reset] = useQueryState("reset", parseAsBoolean.withDefault(false));

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

  // On success the auth slice updates and <RequireGuest> redirects.
  const onSubmit = handleSubmit((values) => login(values));

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      <div>
        <h1 className="text-xl font-semibold">Welcome back</h1>
        <p className="text-sm text-muted">Log in to manage your mess</p>
      </div>

      {reset && !error && <Alert tone="success">Password updated. Log in with your new password.</Alert>}
      {error && <Alert>{getErrorMessage(error)}</Alert>}

      <Field
        label="Phone or email"
        autoComplete="username"
        placeholder="01XXXXXXXXX or you@example.com"
        error={errors.identifier?.message}
        {...register("identifier")}
      />
      <Field
        label="Password"
        type="password"
        autoComplete="current-password"
        error={errors.password?.message}
        {...register("password")}
      />

      <div className="-mt-2 text-right">
        <Link href={ROUTES.forgotPassword} className="text-xs text-primary hover:underline">
          Forgot password?
        </Link>
      </div>

      <Button type="submit" loading={isLoading}>
        Log in
      </Button>

      <p className="text-center text-sm text-muted">
        New to Messora?{" "}
        <Link href={ROUTES.register} className="font-medium text-primary hover:underline">
          Create an account
        </Link>
      </p>
    </form>
  );
}
