"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

/** Matches the server's resend cooldown. */
const COOLDOWN_SECONDS = 60;

/**
 * "Resend code" link with a visible countdown, so users aren't left guessing why it's disabled.
 * By default the countdown starts immediately, for screens shown right after a code was sent.
 */
export function ResendCodeButton({
  onResend,
  initialCooldown = COOLDOWN_SECONDS,
}: {
  onResend: () => Promise<unknown>;
  initialCooldown?: number;
}) {
  const [secondsLeft, setSecondsLeft] = useState(initialCooldown);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  const resend = async () => {
    setSending(true);
    try {
      await onResend();
      toast.success("A new code is on its way");
      setSecondsLeft(COOLDOWN_SECONDS);
    } catch {
      // The caller shows the request error.
    } finally {
      setSending(false);
    }
  };

  return (
    <Button type="button" variant="link" disabled={secondsLeft > 0 || sending} onClick={resend}>
      {secondsLeft > 0 ? <span className="tabular">Resend in {secondsLeft}s</span> : "Resend code"}
    </Button>
  );
}
