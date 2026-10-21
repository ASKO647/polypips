"use client";

import { useEffect, useState } from "react";
import { useRouter } from "@/i18n/navigation";

const LAST_PATH_KEY = "polypips-last-path";

/** Backs "Reprendre ma dernière session" (Préférences tab): on landing on
 * the dashboard root with that preference enabled, jumps straight to the
 * last route this browser visited instead of the default overview — only
 * when no explicit "page affichée au démarrage" already sent the user
 * somewhere else server-side. */
export function ResumeRedirect({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    try {
      const lastPath = window.localStorage.getItem(LAST_PATH_KEY);
      if (lastPath && lastPath !== "/dashboard") {
        // One-time hydration from a browser-only API unavailable during SSR.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setRedirecting(true);
        router.replace(lastPath);
      }
    } catch {
      // Best-effort only.
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  if (!redirecting) return null;
  return <div className="fixed inset-0 z-[60] bg-dash-bg" aria-hidden="true" />;
}
