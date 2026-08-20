"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import {
  readStoredConsent,
  writeStoredConsent,
  type CookieConsent,
} from "@/lib/cookies/consent";

type CookieConsentContextValue = {
  /** null = no choice recorded yet (first visit, or a cleared cookie). */
  consent: CookieConsent | null;
  /** False until the client has read the cookie once — lets consumers
   * avoid a flash of the banner before we know there's already a stored
   * choice. */
  hydrated: boolean;
  /** True while the preferences panel should be shown even though a
   * choice already exists — set by the footer's "Gérer mes cookies" link. */
  preferencesOpen: boolean;
  openPreferences: () => void;
  closePreferences: () => void;
  acceptAll: () => void;
  rejectAll: () => void;
  save: (analytics: boolean) => void;
};

const CookieConsentContext = createContext<CookieConsentContextValue | null>(null);

export function CookieConsentProvider({ children }: { children: React.ReactNode }) {
  const [consent, setConsent] = useState<CookieConsent | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [preferencesOpen, setPreferencesOpen] = useState(false);

  useEffect(() => {
    // document.cookie isn't available server-side, and reading it during
    // the initial client render (before hydration matches the server's
    // markup) would cause a mismatch — so this has to happen post-mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setConsent(readStoredConsent());
    setHydrated(true);
  }, []);

  const persist = useCallback((analytics: boolean) => {
    writeStoredConsent(analytics);
    setConsent({ essential: true, analytics });
    setPreferencesOpen(false);
  }, []);

  const value: CookieConsentContextValue = {
    consent,
    hydrated,
    preferencesOpen,
    openPreferences: () => setPreferencesOpen(true),
    closePreferences: () => setPreferencesOpen(false),
    acceptAll: () => persist(true),
    rejectAll: () => persist(false),
    save: persist,
  };

  return (
    <CookieConsentContext.Provider value={value}>
      {children}
    </CookieConsentContext.Provider>
  );
}

export function useCookieConsent(): CookieConsentContextValue {
  const ctx = useContext(CookieConsentContext);
  if (!ctx) {
    throw new Error("useCookieConsent must be used within a CookieConsentProvider");
  }
  return ctx;
}
