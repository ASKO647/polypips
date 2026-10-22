"use client";

import { useEffect, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { isResumableDashboardRoute } from "@/lib/dashboard-resumable-routes";
import type { StartPage } from "@/lib/supabase/user-settings";

const LAST_PATH_KEY = "polypips-last-path";
/** sessionStorage, not localStorage: must fire at most once per browser
 * tab / installed-PWA session, and never again for the rest of that
 * session — otherwise every click on "Tableau de bord" re-triggers the
 * exact redirect loop this component exists to prevent. sessionStorage is
 * cleared when the tab/PWA instance closes, which is exactly "a new
 * session" per the bug report. */
const ENTRY_HANDLED_KEY = "polypips-dashboard-entry-handled";

/**
 * Runs once per browser session on first landing at /dashboard. In order:
 * 1. If "Reprendre ma dernière session" is genuinely on (both the stored
 *    preference AND proof the user explicitly chose it — see
 *    isResumeLastSessionActive) and the remembered last path is still on
 *    the resumable allow-list, replace to it.
 * 2. Otherwise, if "page affichée au démarrage" is set to Polymarket,
 *    replace to its landing page.
 * 3. Otherwise do nothing — stay on the dashboard overview.
 *
 * After the first run (whatever it decided), the session flag is set and
 * every subsequent /dashboard visit this session — including clicking
 * "Tableau de bord" in the nav — is a no-op: the dashboard overview always
 * renders normally.
 */
export function DashboardEntryRedirect({
  resumeActive,
  startPage,
}: {
  resumeActive: boolean;
  startPage: StartPage;
}) {
  const router = useRouter();
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    let alreadyHandled = false;
    try {
      alreadyHandled = window.sessionStorage.getItem(ENTRY_HANDLED_KEY) === "1";
    } catch {
      // If sessionStorage is unavailable, fail safe by treating this as
      // already-handled — never redirect rather than risk looping.
      alreadyHandled = true;
    }
    if (alreadyHandled) return;

    try {
      window.sessionStorage.setItem(ENTRY_HANDLED_KEY, "1");
    } catch {
      // Best-effort — if we can't persist the flag we also can't safely
      // redirect (would re-fire every time), so bail out below instead.
      return;
    }

    if (resumeActive) {
      try {
        const lastPath = window.localStorage.getItem(LAST_PATH_KEY);
        if (lastPath && isResumableDashboardRoute(lastPath)) {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setRedirecting(true);
          router.replace(lastPath);
          return;
        }
      } catch {
        // Fall through to the startPage check.
      }
    }

    if (startPage === "polymarket") {
      setRedirecting(true);
      router.replace("/dashboard/analyse-ia");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!redirecting) return null;
  return <div className="fixed inset-0 z-[60] bg-dash-bg" aria-hidden="true" />;
}
