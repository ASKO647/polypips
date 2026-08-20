import { headers } from "next/headers";

/**
 * Derives the current request's origin from standard forwarding headers
 * (set by Vercel/any reverse proxy) instead of hardcoding a production
 * domain — works unmodified in dev, preview, and production. Used to
 * build the full /i/[slug] link shown in the influencer console.
 */
export async function requestOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
