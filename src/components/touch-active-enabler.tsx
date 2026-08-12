"use client";

import { useEffect } from "react";

/**
 * iOS Safari only triggers the CSS `:active` pseudo-class on tap when a
 * touchstart listener exists somewhere in the document. Without this, every
 * `active:` Tailwind class in the app is silently inert on real iPhones,
 * giving zero visual confirmation that a tap registered.
 */
export function TouchActiveEnabler() {
  useEffect(() => {
    const noop = () => {};
    document.addEventListener("touchstart", noop, { passive: true });
    return () => document.removeEventListener("touchstart", noop);
  }, []);

  return null;
}
