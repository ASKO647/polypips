"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import styles from "./dashboard-preferences.module.css";
import { createClient } from "@/lib/supabase/client";
import { fetchUserSettings } from "@/lib/supabase/user-settings";

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
  const [choice, setChoice] = useState<"light" | "dark" | "system">(initialThemeChoice ?? "light");
  const [display, setDisplay] = useState({ density: "comfortable", animations: true, reduceMotion: false, contrast: false, keyboardFocus: true, textSize: 50 });

  useEffect(() => {
    let previewed = false;
    const update = (event: Event) => {
      previewed = true;
      const values = (event as CustomEvent).detail;
      if (!values) return;
      setDisplay(current => ({ ...current, ...values }));
      if (["light", "dark", "system"].includes(values.themeChoice)) setChoice(values.themeChoice);
    };
    window.addEventListener("polypips-preferences-preview", update);
    let active = true;
    fetchUserSettings(createClient()).then(settings => { if (active && !previewed) { setDisplay(settings); setChoice(settings.themeChoice); } });
    return () => { active = false; window.removeEventListener("polypips-preferences-preview", update); };
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => setThemeState(choice === "system" ? (media.matches ? "dark" : "light") : choice);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [choice]);

  const setTheme = (next: DashboardTheme) => {
    setChoice(next);
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
      <div className={styles.runtime} data-density={display.density} data-motion={!display.animations || display.reduceMotion ? "reduced" : "full"} data-contrast={display.contrast} data-focus={display.keyboardFocus} style={{ "--preference-scale": String(.9 + Math.max(0, Math.min(100, display.textSize)) * .004) } as React.CSSProperties}>{children}</div>
    </DashboardThemeContext.Provider>
  );
}

export function useDashboardTheme() {
  const ctx = useContext(DashboardThemeContext);
  if (!ctx) throw new Error("useDashboardTheme must be used within DashboardThemeProvider");
  return ctx;
}
