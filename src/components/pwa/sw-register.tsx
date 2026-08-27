"use client";

import { useEffect } from "react";

/**
 * Only registers in production — a service worker caching hashed dev bundles
 * would serve stale chunks across Fast Refresh reloads. Vercel builds run
 * production, so this is the only environment that ever gets one.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Registration failing (e.g. unsupported browser) must never break the app.
    });
  }, []);

  return null;
}
