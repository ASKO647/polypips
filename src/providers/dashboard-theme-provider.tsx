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
 * (persisted in localStorage, per-browser) switches it. Reads
 * synchronously from localStorage during init so there's no dark->light
 * flash on reload for a user who already chose light. */
export function DashboardThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<DashboardTheme>("dark");

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      // One-time hydration from a browser-only API unavailable during SSR —
      // there's no external-system subscription to model this as instead.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (stored === "light" || stored === "dark") setThemeState(stored);
    } catch {
      // localStorage unavailable (private mode, blocked) — stay on the dark default.
    }
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
