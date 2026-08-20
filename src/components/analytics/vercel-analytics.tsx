"use client";

import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { useCookieConsent } from "@/providers/cookie-consent-provider";

/**
 * Mounts Vercel Analytics + Speed Insights only once the visitor has opted
 * into the "analytics" cookie-consent category (see
 * lib/cookies/consent.ts) — that category already existed in the RGPD
 * consent system, unused, before this tool was wired in. Nothing is
 * rendered (no script loads, no beacons fire) until `consent.analytics` is
 * true; a rejected or not-yet-decided visitor is measured by neither tool.
 */
export function VercelAnalyticsGate() {
  const { consent } = useCookieConsent();
  if (!consent?.analytics) return null;

  return (
    <>
      <Analytics />
      <SpeedInsights />
    </>
  );
}
