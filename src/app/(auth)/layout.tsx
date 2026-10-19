import { Suspense } from "react";
import { CalendarCheck, ReceiptText, Wallet } from "lucide-react";
import { Logo } from "@/components/common/logo";
import { FullPageSpinner } from "@/components/ui/spinner";
import { ROUTES } from "@/constants/routes";
import { RequireGuest } from "@/features/auth/components/require-guest";

const highlights = [
  { icon: CalendarCheck, title: "Daily meals", text: "Members switch meals on or off before the cutoff." },
  { icon: ReceiptText, title: "Bazar & expenses", text: "Every taka logged, approved and shared fairly." },
  { icon: Wallet, title: "Monthly bills", text: "Meal rate and everyone's due, calculated for you." },
];

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <Suspense fallback={<FullPageSpinner />}>
      <RequireGuest>
        <div className="grid min-h-svh lg:grid-cols-[1fr_1.1fr]">
          {/* Brand panel, desktop only */}
          <aside className="relative hidden overflow-hidden bg-primary p-10 text-primary-foreground lg:flex lg:flex-col">
            <div
              aria-hidden
              className="pointer-events-none absolute -top-40 -right-40 size-112 rounded-full bg-white/10 blur-3xl"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -bottom-48 -left-24 size-120 rounded-full bg-black/10 blur-3xl"
            />
            <Logo
              href={ROUTES.home}
              className="relative [&>span:first-child]:bg-white/15 [&>span:first-child]:shadow-none"
            />
            <div className="relative mt-auto max-w-md">
              <h2 className="text-3xl leading-tight font-semibold tracking-tight">
                Your mess, finally organised.
              </h2>
              <p className="mt-3 text-primary-foreground/80">
                Meals, bazar, deposits and the monthly bill, in one place everyone can trust.
              </p>
              <ul className="mt-10 grid gap-5">
                {highlights.map(({ icon: Icon, title, text }) => (
                  <li key={title} className="flex gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/15">
                      <Icon className="size-4.5" aria-hidden />
                    </span>
                    <div>
                      <p className="font-medium">{title}</p>
                      <p className="text-sm text-primary-foreground/75">{text}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          {/* Form panel */}
          <main className="flex flex-col px-4 py-8 sm:px-8">
            <Logo href={ROUTES.home} className="self-center lg:hidden" />
            <div className="mx-auto flex w-full max-w-sm flex-1 animate-in flex-col justify-center py-10 duration-300 fade-in-0 slide-in-from-bottom-2">
              {children}
            </div>
            <p className="text-center text-xs text-muted-foreground">Messora · Mess management made simple</p>
          </main>
        </div>
      </RequireGuest>
    </Suspense>
  );
}
