import Link from "next/link";
import { ROUTES } from "@/constants/routes";

export default function HomePage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-6 px-4 py-16 text-center">
      <span className="rounded-full border border-border px-3 py-1 text-xs text-muted">Mess management made simple</span>
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
        Run your mess without the <span className="text-primary">spreadsheet</span>
      </h1>
      <p className="max-w-xl text-muted">
        Track daily meals, bazar, deposits and shared expenses. Messora calculates the meal rate and everyone&apos;s
        bill at the end of the month.
      </p>
      <div className="flex gap-3">
        <Link
          href={ROUTES.register}
          className="inline-flex h-10 items-center rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Get started
        </Link>
        <Link
          href={ROUTES.login}
          className="inline-flex h-10 items-center rounded-lg border border-border bg-card px-5 text-sm font-medium"
        >
          Log in
        </Link>
      </div>
    </main>
  );
}
