"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { parseAsString, useQueryState } from "nuqs";
import { ArrowLeft, CircleAlert, Clock } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import { ROUTES } from "@/constants/routes";
import { getErrorCode, getErrorMessage } from "@/lib/api-error";
import { useJoinMessMutation } from "../messes-api";
import { joinMessSchema, type JoinMessValues } from "../messes-schemas";
import type { Mess } from "../messes-types";

/** Ask to join a mess with its join code. `?code=` pre-fills it, so join links work. */
export function JoinMessForm() {
  const [codeParam] = useQueryState("code", parseAsString.withDefault(""));
  const [joinMess, { isLoading, error }] = useJoinMessMutation();
  const [requested, setRequested] = useState<Mess | null>(null);

  const form = useForm<JoinMessValues>({
    resolver: zodResolver(joinMessSchema),
    defaultValues: { joinCode: codeParam.toUpperCase() },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    const res = await joinMess(values);
    if (!res.error) setRequested(res.data);
  });

  // Already a member (e.g. they opened a join link twice): offer a way back to their messes.
  const alreadyMember = getErrorCode(error) === "ALREADY_MEMBER";

  return (
    <div className="mx-auto grid w-full max-w-md gap-6">
      <Button
        variant="link"
        asChild
        className="justify-self-start text-muted-foreground hover:text-foreground"
      >
        <Link href={ROUTES.messes}>
          <ArrowLeft />
          My messes
        </Link>
      </Button>

      {requested ? (
        <Card className="animate-in items-center px-6 py-10 text-center duration-300 fade-in-0 zoom-in-[0.98]">
          <span className="flex size-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
            <Clock className="size-6" aria-hidden />
          </span>
          <div className="space-y-1">
            <h1 className="text-xl font-semibold">Request sent</h1>
            <p className="text-sm text-muted-foreground">
              We&apos;ve asked the managers of{" "}
              <span className="font-medium text-foreground">{requested.name}</span> to let you in. You&apos;ll
              get access as soon as they approve.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href={ROUTES.messes}>Back to my messes</Link>
          </Button>
        </Card>
      ) : (
        <Card className="px-6">
          <div className="space-y-1">
            <h1 className="text-xl font-semibold">Join a mess</h1>
            <p className="text-sm text-muted-foreground">
              Enter the join code your mess manager shared with you.
            </p>
          </div>
          <Form {...form}>
            <form onSubmit={onSubmit} className="grid gap-5" noValidate>
              {error && (
                <Alert variant="destructive">
                  <CircleAlert />
                  <AlertDescription>
                    {getErrorMessage(error)}
                    {alreadyMember && (
                      <Button size="sm" variant="outline" asChild className="mt-2">
                        <Link href={ROUTES.messes}>Open my messes</Link>
                      </Button>
                    )}
                  </AlertDescription>
                </Alert>
              )}
              <FormField
                control={form.control}
                name="joinCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Join code</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        onChange={(e) => field.onChange(e.target.value.toUpperCase().replace(/\s/g, ""))}
                        autoFocus={!codeParam}
                        autoComplete="off"
                        autoCapitalize="characters"
                        spellCheck={false}
                        maxLength={12}
                        placeholder="ABCD2345"
                        className="h-12 text-center font-mono text-lg tracking-[0.3em] uppercase"
                      />
                    </FormControl>
                    <FormDescription>8 letters and numbers.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" size="lg" loading={isLoading}>
                Ask to join
              </Button>
            </form>
          </Form>
        </Card>
      )}
    </div>
  );
}
