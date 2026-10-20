"use client";

import { useRef, useState } from "react";
import { Camera, ImageUp, Loader2, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { useReceiptUpload } from "../receipt-upload";

export interface ReceiptState {
  /** Storage key of a newly uploaded receipt; null = no receipt; undefined = unchanged. */
  key?: string | null;
  previewUrl: string | null;
  uploading: boolean;
}

/**
 * Receipt photo: opens the camera on phones, uploads in the background as soon as it's picked, so
 * saving the bazar doesn't wait for it.
 */
export function ReceiptField({
  value,
  onChange,
}: {
  value: ReceiptState;
  onChange: (next: ReceiptState) => void;
}) {
  const upload = useReceiptUpload();
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string>();
  const [lastFile, setLastFile] = useState<File>();

  const pick = async (file: File | undefined) => {
    if (!file) return;
    setError(undefined);
    setLastFile(file);
    const previewUrl = URL.createObjectURL(file);
    onChange({ key: undefined, previewUrl, uploading: true });
    try {
      onChange({ key: await upload(file), previewUrl, uploading: false });
    } catch (err) {
      setError(err instanceof Error ? err.message : "The receipt didn't upload.");
      onChange({ key: undefined, previewUrl, uploading: false });
    }
  };

  const remove = () => {
    setError(undefined);
    onChange({ key: null, previewUrl: null, uploading: false });
    if (input.current) input.current.value = "";
  };

  return (
    <div className="grid gap-2">
      <input
        ref={input}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        aria-label="Receipt photo"
        onChange={(e) => pick(e.target.files?.[0])}
      />
      {value.previewUrl ? (
        <div className="flex items-center gap-3 rounded-lg border bg-muted/20 p-2">
          {/* eslint-disable-next-line @next/next/no-img-element -- local blob/signed URLs, not optimisable */}
          <img
            src={value.previewUrl}
            alt="Receipt"
            className={cn("size-16 rounded-md object-cover", value.uploading && "opacity-60")}
          />
          <div className="min-w-0 flex-1 text-sm">
            {value.uploading ? (
              <p className="flex items-center gap-1.5 text-muted-foreground">
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Uploading…
              </p>
            ) : error ? (
              <p className="text-destructive">{error}</p>
            ) : (
              <p className="text-muted-foreground">Receipt added</p>
            )}
          </div>
          {error && lastFile && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Try again"
              onClick={() => pick(lastFile)}
            >
              <RotateCcw />
            </Button>
          )}
          <Button type="button" variant="ghost" size="icon" aria-label="Remove receipt" onClick={remove}>
            <X />
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="h-14 justify-start gap-3 border-dashed"
          onClick={() => input.current?.click()}
        >
          <Camera className="sm:hidden" />
          <ImageUp className="hidden sm:block" />
          <span>
            Add receipt photo <span className="font-normal text-muted-foreground">(optional)</span>
          </span>
        </Button>
      )}
    </div>
  );
}
