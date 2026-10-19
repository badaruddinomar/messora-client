"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { parseAsString, useQueryState } from "nuqs";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { getErrorMessage, getFieldErrors } from "@/lib/api-error";
import { useRegisterMutation } from "../auth-api";
import { registerSchema, type RegisterValues } from "../auth-schemas";
import { ROUTES } from "@/constants/routes";

export function RegisterForm() {
  const [, setNext] = useQueryState("next", parseAsString);
  const [registerUser, { isLoading, error }] = useRegisterMutation();
  const serverErrors = getFieldErrors(error);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterValues>({ resolver: zodResolver(registerSchema) });

  const onSubmit = handleSubmit(async (values) => {
    // <RequireGuest> redirects once the session exists; users who gave an email
    // go straight to entering the code we just sent them.
    if (values.email) await setNext(ROUTES.verifyEmail);
    await registerUser(values);
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      <div>
        <h1 className="text-xl font-semibold">Create your account</h1>
        <p className="text-sm text-muted">Join or start a mess in minutes</p>
      </div>

      {error && <Alert>{getErrorMessage(error)}</Alert>}

      <Field
        label="Full name"
        autoComplete="name"
        error={errors.name?.message ?? serverErrors.name?.[0]}
        {...register("name")}
      />
      <Field
        label="Phone number"
        type="tel"
        autoComplete="tel"
        placeholder="01XXXXXXXXX"
        error={errors.phone?.message ?? serverErrors.phone?.[0]}
        {...register("phone")}
      />
      <Field
        label="Email (optional)"
        type="email"
        autoComplete="email"
        hint="Needed to reset your password by email"
        error={errors.email?.message ?? serverErrors.email?.[0]}
        {...register("email")}
      />
      <Field
        label="Password"
        type="password"
        autoComplete="new-password"
        error={errors.password?.message ?? serverErrors.password?.[0]}
        {...register("password")}
      />

      <Button type="submit" loading={isLoading}>
        Create account
      </Button>

      <p className="text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href={ROUTES.login} className="font-medium text-primary hover:underline">
          Log in
        </Link>
      </p>
    </form>
  );
}
