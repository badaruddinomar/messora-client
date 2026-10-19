"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CircleAlert, MailCheck } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { InputOTP } from "@/components/ui/input-otp";
import { ROUTES } from "@/constants/routes";
import { getErrorMessage } from "@/lib/api-error";
import { useAppSelector } from "@/store/hooks";
import { useSendEmailVerificationMutation, useVerifyEmailMutation } from "../auth-api";
import { selectUser } from "../auth-slice";
import { verifyCodeSchema, type VerifyCodeValues } from "../auth-schemas";
import { AuthHeading } from "./auth-heading";
import { ResendCodeButton } from "./resend-code-button";

export function VerifyEmailForm() {
  const router = useRouter();
  const user = useAppSelector(selectUser);
  const [verifyEmail, { isLoading, error }] = useVerifyEmailMutation();
  const [resend, resendState] = useSendEmailVerificationMutation();

  const form = useForm<VerifyCodeValues>({
    resolver: zodResolver(verifyCodeSchema),
    defaultValues: { code: "" },
  });

  if (!user?.email) {
    return (
      <AuthHeading
        title="No email address"
        description="Your account doesn't have an email address to verify."
      />
    );
  }

  if (user.emailVerifiedAt) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-success/10 text-success">
          <MailCheck className="size-6" />
        </span>
        <AuthHeading title="Email verified" description={`${user.email} is verified.`} />
        <Button asChild>
          <Link href={ROUTES.dashboard}>Go to dashboard</Link>
        </Button>
      </div>
    );
  }

  const onSubmit = form.handleSubmit(async (values) => {
    const res = await verifyEmail(values);
    if (!res.error) {
      toast.success("Email verified");
      router.replace(ROUTES.dashboard);
    }
  });

  const requestError = error ?? resendState.error;

  return (
    <>
      <AuthHeading
        title="Verify your email"
        description={
          <>
            Enter the 6-digit code we sent to{" "}
            <span className="font-medium text-foreground">{user.email}</span>.
          </>
        }
      />
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
                <FormLabel>Verification code</FormLabel>
                <FormControl>
                  {/* Submits on its own once all 6 digits are in. */}
                  <InputOTP autoFocus onComplete={() => onSubmit()} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" size="lg" loading={isLoading}>
            Verify email
          </Button>

          <div className="flex items-center justify-between text-sm">
            <Button variant="link" asChild className="text-muted-foreground hover:text-foreground">
              <Link href={ROUTES.dashboard}>Skip for now</Link>
            </Button>
            <ResendCodeButton onResend={() => resend().unwrap()} initialCooldown={0} />
          </div>
        </form>
      </Form>
    </>
  );
}
