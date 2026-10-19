"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { parseAsBoolean, useQueryState } from "nuqs";
import { CircleAlert, CircleCheck } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { ROUTES } from "@/constants/routes";
import { getErrorMessage } from "@/lib/api-error";
import { useLoginMutation } from "../auth-api";
import { loginSchema, type LoginValues } from "../auth-schemas";
import { AuthHeading } from "./auth-heading";

export function LoginForm() {
  const [login, { isLoading, error }] = useLoginMutation();
  // Set by the reset-password flow to confirm the change here.
  const [reset] = useQueryState("reset", parseAsBoolean.withDefault(false));

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: "", password: "" },
  });

  // On success the auth slice updates and <RequireGuest> redirects.
  const onSubmit = form.handleSubmit((values) => login(values));

  return (
    <>
      <AuthHeading title="Welcome back" description="Log in to manage your mess." />
      <Form {...form}>
        <form onSubmit={onSubmit} className="grid gap-5" noValidate>
          {error ? (
            <Alert variant="destructive">
              <CircleAlert />
              <AlertDescription>{getErrorMessage(error)}</AlertDescription>
            </Alert>
          ) : (
            reset && (
              <Alert variant="success">
                <CircleCheck />
                <AlertDescription>Password updated. Log in with your new password.</AlertDescription>
              </Alert>
            )
          )}

          <FormField
            control={form.control}
            name="identifier"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone or email</FormLabel>
                <FormControl>
                  <Input
                    autoComplete="username"
                    placeholder="01XXXXXXXXX or you@example.com"
                    autoFocus
                    {...field}
                  />
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
                <div className="flex items-center justify-between">
                  <FormLabel>Password</FormLabel>
                  <Link
                    href={ROUTES.forgotPassword}
                    className="text-xs font-medium text-primary underline-offset-4 hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <FormControl>
                  <PasswordInput autoComplete="current-password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" size="lg" loading={isLoading} className="mt-1">
            Log in
          </Button>
        </form>
      </Form>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        New to Messora?{" "}
        <Link href={ROUTES.register} className="font-medium text-primary underline-offset-4 hover:underline">
          Create an account
        </Link>
      </p>
    </>
  );
}
