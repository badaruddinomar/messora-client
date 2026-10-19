"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { parseAsString, useQueryState } from "nuqs";
import { CircleAlert } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { ROUTES } from "@/constants/routes";
import { applyFieldErrors, getErrorMessage, type RequestError } from "@/lib/api-error";
import { useRegisterMutation } from "../auth-api";
import { registerSchema, type RegisterValues } from "../auth-schemas";
import { AuthHeading } from "./auth-heading";

export function RegisterForm() {
  const [, setNext] = useQueryState("next", parseAsString);
  const [registerUser, { isLoading }] = useRegisterMutation();
  // Only errors that couldn't be shown on a field go in the alert.
  const [formError, setFormError] = useState<RequestError>();

  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", phone: "", email: "", password: "" },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(undefined);
    // <RequireGuest> redirects once the session exists; users who gave an email
    // go straight to entering the code we just sent them.
    if (values.email) await setNext(ROUTES.verifyEmail);
    const res = await registerUser(values);
    if (res.error && !applyFieldErrors(res.error, form.setError)) setFormError(res.error);
  });

  return (
    <>
      <AuthHeading title="Create your account" description="Start a mess or join one in minutes." />
      <Form {...form}>
        <form onSubmit={onSubmit} className="grid gap-5" noValidate>
          {formError && (
            <Alert variant="destructive">
              <CircleAlert />
              <AlertDescription>{getErrorMessage(formError)}</AlertDescription>
            </Alert>
          )}

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full name</FormLabel>
                <FormControl>
                  <Input autoComplete="name" autoFocus {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone number</FormLabel>
                <FormControl>
                  <Input type="tel" inputMode="tel" autoComplete="tel" placeholder="01XXXXXXXXX" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Email <span className="font-normal text-muted-foreground">(optional)</span>
                </FormLabel>
                <FormControl>
                  <Input type="email" autoComplete="email" placeholder="you@example.com" {...field} />
                </FormControl>
                <FormDescription>Lets you reset your password by email.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <PasswordInput autoComplete="new-password" {...field} />
                </FormControl>
                <FormDescription>At least 8 characters.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" size="lg" loading={isLoading} className="mt-1">
            Create account
          </Button>
        </form>
      </Form>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href={ROUTES.login} className="font-medium text-primary underline-offset-4 hover:underline">
          Log in
        </Link>
      </p>
    </>
  );
}
