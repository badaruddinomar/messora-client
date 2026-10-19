/**
 * Remembers which mess the user opened last, so /dashboard can take them straight back there.
 * Purely a convenience: storage can be unavailable (private mode), so every access is guarded.
 */
const KEY = "messora:last-mess";

export function rememberLastMess(slug: string) {
  try {
    localStorage.setItem(KEY, slug);
  } catch {
    // Not critical.
  }
}

export function readLastMess(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}
