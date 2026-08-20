"use client";

import { useEffect } from "react";
import {
  readStoredAttribution,
  resolveLandingAttribution,
  writeStoredAttribution,
} from "@/lib/attribution/capture";

/**
 * Captures first-touch signup attribution (UTM params or referrer) once
 * per visitor. A no-op past the very first page of a session — see
 * lib/attribution/capture.ts for why an existing cookie is never
 * overwritten.
 */
export function AttributionCapture() {
  useEffect(() => {
    if (readStoredAttribution()) return;
    const attribution = resolveLandingAttribution(
      new URL(window.location.href),
      document.referrer
    );
    writeStoredAttribution(attribution);
  }, []);

  return null;
}
