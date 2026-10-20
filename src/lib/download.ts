/** The file name from `Content-Disposition: attachment; filename="…"`. */
export function fileNameFrom(disposition: string | null, fallback: string) {
  return disposition?.match(/filename="([^"]+)"/)?.[1] ?? fallback;
}

/**
 * Downloads a file from the API (CSV exports). Like the API client, a 401 refreshes the session once
 * and retries, so an expired access token doesn't turn into a failed download.
 */
export async function downloadFile(url: string, fallbackName: string) {
  const get = () => fetch(url, { credentials: "include" });
  let res = await get();
  if (res.status === 401) {
    const refreshed = await fetch("/api/v1/auth/refresh", { method: "POST", credentials: "include" });
    if (refreshed.ok) res = await get();
  }
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { message?: string } | null;
    throw new Error(body?.message ?? "Couldn't download the file");
  }

  const href = URL.createObjectURL(await res.blob());
  const link = Object.assign(document.createElement("a"), {
    href,
    download: fileNameFrom(res.headers.get("Content-Disposition"), fallbackName),
  });
  document.body.append(link);
  link.click();
  link.remove();
  // Give the browser a moment to start the download before the URL goes away.
  setTimeout(() => URL.revokeObjectURL(href), 1000);
}
