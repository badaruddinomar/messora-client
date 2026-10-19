"use client";

import { useParams } from "next/navigation";
import { useMyMessesQuery } from "../messes-api";

/**
 * Resolves the mess for the `/m/[slug]` segment of the current URL from the (cached) list of the
 * user's messes. Works anywhere in the app, including the sidebar, which sits outside mess pages.
 */
export function useMessFromRoute() {
  const params = useParams<{ slug?: string }>();
  const slug = params?.slug ?? null;
  const query = useMyMessesQuery(undefined, { skip: !slug });
  const mess = slug ? (query.data?.find((m) => m.slug === slug) ?? null) : null;
  return { slug, mess, ...query };
}
