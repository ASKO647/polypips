"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type DashboardTheme = "dark" | "light";

const STORAGE_KEY = "polypips-dashboard-theme";

type DashboardThemeContextValue = {
  theme: DashboardTheme;
  setTheme: (theme: DashboardTheme) => void;
  toggleTheme: () => void;
};

const DashboardThemeContext = createContext<DashboardThemeContextValue | null>(null);

/** Independent from the site-wide next-themes provider (forced light for
 * marketing pages) — the dashboard was deliberately dark-only for a long
 * time, so this defaults to "dark" and only a user's own explicit choice
 * switches it. Reads synchronously from localStorage during init so
 * there's no dark->light flash on reload for a user who already chose
 * light on this browser; when this browser has no such override yet, it
 * falls back to `initialThemeChoice` (the user's cross-device choice,
 * synced via user_settings and resolved server-side in dashboard/layout.tsx)
 * instead of always defaulting to dark. Either way the choice is then
 * persisted to localStorage, per-browser. */
export function DashboardThemeProvider({
  children,
  initialThemeChoice,
}: {
  children: ReactNode;
  initialThemeChoice?: "light" | "dark" | "system";
}) {
  const [theme, setThemeState] = useState<DashboardTheme>("dark");

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === "light" || stored === "dark") {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setThemeState(stored);
        return;
      }
    } catch {
      // localStorage unavailable (private mode, blocked) — fall through to the synced choice.
    }
    if (initialThemeChoice === "light") {
      setThemeState("light");
    } else if (initialThemeChoice === "system") {
      setThemeState(window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setTheme = (next: DashboardTheme) => {
    setThemeState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Best-effort persistence only — the toggle still works for this session.
    }
  };

  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

  return (
    <DashboardThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </DashboardThemeContext.Provider>
  );
}

export function useDashboardTheme() {
  const ctx = useContext(DashboardThemeContext);
  if (!ctx) throw new Error("useDashboardTheme must be used within DashboardThemeProvider");
  return ctx;
}
