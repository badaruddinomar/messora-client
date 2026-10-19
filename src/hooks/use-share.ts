"use client";

import { useCallback } from "react";
import { toast } from "sonner";

/** Copy text to the clipboard, or open the native share sheet, with feedback toasts. */
export function useShare() {
  const copy = useCallback(async (text: string, label = "Copied") => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(label);
      return true;
    } catch {
      toast.error("Couldn't copy. Select the text and copy it manually.");
      return false;
    }
  }, []);

  const canShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

  /** Uses the native share sheet on phones; falls back to copying the link. */
  const share = useCallback(
    async (data: { title: string; text: string; url: string }) => {
      if (canShare) {
        try {
          await navigator.share(data);
          return;
        } catch (err) {
          // Closing the share sheet isn't an error.
          if (err instanceof DOMException && err.name === "AbortError") return;
        }
      }
      await copy(data.url, "Link copied");
    },
    [canShare, copy],
  );

  return { copy, share, canShare };
}

/** A wa.me link that opens WhatsApp with the message ready to send. */
export const whatsappShareUrl = (text: string) => `https://wa.me/?text=${encodeURIComponent(text)}`;
