/** Only allow same-site relative paths, to avoid open redirects via `?next=`. */
export const safeNext = (next: string | null) => (next?.startsWith("/") && !next.startsWith("//") ? next : null);
