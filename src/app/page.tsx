import Link from "next/link";
import { ArrowRight, CalendarCheck, ReceiptText, Wallet } from "lucide-react";
import { Logo } from "@/components/common/logo";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";

const features = [
  {
    icon: CalendarCheck,
    title: "Meals that count themselves",
    text: "Members switch meals on or off before the cutoff. Guests and half meals included.",
  },
  {
    icon: ReceiptText,
    title: "Bazar, bills & deposits",
    text: "Log every taka with receipts and approvals, so nobody has to ask twice.",
  },
  {
    icon: Wallet,
    title: "A fair monthly bill",
    text: "Meal rate, shared costs and everyone's due or refund, calculated exactly.",
  },
];

export default function HomePage() {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo />
        <Button variant="ghost" asChild>
          <Link href={ROUTES.login}>Log in</Link>
        </Button>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center px-4 pt-16 pb-20 text-center sm:px-6 sm:pt-24">
        <span className="animate-in rounded-full border bg-card px-3 py-1 text-xs text-muted-foreground shadow-xs duration-500 fade-in-0">
          Mess management made simple
        </span>
        <h1 className="mt-6 max-w-3xl animate-in text-4xl font-semibold tracking-tight text-balance duration-500 fade-in-0 slide-in-from-bottom-2 sm:text-6xl">
          Run your mess without the <span className="text-primary">spreadsheet</span>
        </h1>
        <p className="mt-6 max-w-xl animate-in text-base text-pretty text-muted-foreground duration-500 fade-in-0 slide-in-from-bottom-2 sm:text-lg">
          Track daily meals, bazar, deposits and shared expenses. Messora works out the meal rate and
          everyone&apos;s bill at the end of the month.
        </p>
        <div className="mt-10 flex animate-in flex-col gap-3 duration-500 fade-in-0 slide-in-from-bottom-3 sm:flex-row">
          <Button size="lg" asChild>
            <Link href={ROUTES.register}>
              Get started free
              <ArrowRight />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href={ROUTES.login}>I already have an account</Link>
          </Button>
        </div>

        <ul className="mt-24 grid w-full gap-4 text-left sm:grid-cols-3">
          {features.map(({ icon: Icon, title, text }) => (
            <li key={title} className="rounded-xl border bg-card p-6 shadow-xs">
              <span className="flex size-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                <Icon className="size-5" aria-hidden />
              </span>
              <h2 className="mt-4 font-medium">{title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{text}</p>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
