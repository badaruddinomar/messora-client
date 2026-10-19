import { Suspense } from "react";
import { MessPageSkeleton, MessScope } from "@/features/messes/components/mess-scope";

export default function MessLayout({ children }: LayoutProps<"/m/[slug]">) {
  return (
    // The slug is only known at request time, so it's read under a Suspense boundary (Cache Components).
    <Suspense fallback={<MessPageSkeleton />}>
      <MessScope>{children}</MessScope>
    </Suspense>
  );
}
