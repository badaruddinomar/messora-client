"use client";

import { useCurrentMess } from "@/features/messes/mess-context";
import { getErrorMessage } from "@/lib/api-error";
import { useCreateUploadMutation } from "./bazars-api";

const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIDE = 1600;
/** Photos already this small are sent as they are. */
const SMALL_ENOUGH = 600 * 1024;
const MAX_BYTES = 5 * 1024 * 1024;

/**
 * Phone photos are often 4–10 MB. Re-encoding to a 1600 px JPEG keeps receipts readable at a few
 * hundred KB, so uploads are quick on mobile data. Also turns HEIC and other formats the browser
 * can decode into JPEG.
 */
export async function shrinkImage(file: File): Promise<Blob> {
  if (ACCEPTED.includes(file.type) && file.size <= SMALL_ENOUGH) return file;
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    if (ACCEPTED.includes(file.type) && file.size <= MAX_BYTES) return file;
    throw new Error("That photo can't be read. Try a JPEG or PNG.");
  }
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Couldn't prepare the photo"))),
      "image/jpeg",
      0.82,
    ),
  );
}

/** Shrinks and uploads a receipt photo; resolves to the storage key to send with the bazar. */
export function useReceiptUpload() {
  const mess = useCurrentMess();
  const [createUpload] = useCreateUploadMutation();

  return async (file: File) => {
    const blob = await shrinkImage(file);
    if (blob.size > MAX_BYTES) throw new Error("That photo is too large (5 MB at most).");
    const res = await createUpload({
      messId: mess.id,
      purpose: "receipt",
      contentType: blob.type,
      size: blob.size,
    });
    if (res.error) throw new Error(getErrorMessage(res.error));

    const { key, upload } = res.data;
    const put = await fetch(upload.url, { method: upload.method, headers: upload.headers, body: blob });
    if (!put.ok) throw new Error("The receipt didn't upload. Check your connection and try again.");
    return key;
  };
}
