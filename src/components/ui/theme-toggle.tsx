"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- standard next-themes hydration guard
  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <button
      type="button"
      aria-label="Basculer l'apparence"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "relative inline-flex h-11 w-19 items-center rounded-full border border-border-strong bg-surface px-1 transition-colors",
        className
      )}
    >
      <span
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-full bg-surface-muted shadow-sm transition-transform duration-300 ease-out",
          isDark ? "translate-x-8" : "translate-x-0"
        )}
      >
        {isDark ? (
          <Moon className="h-4 w-4 text-brand-500" strokeWidth={2.25} />
        ) : (
          <Sun className="h-4 w-4 text-brand-500" strokeWidth={2.25} />
        )}
      </span>
      <Sun
        className="absolute left-2.5 h-3.5 w-3.5 text-body-soft"
        strokeWidth={2}
      />
      <Moon
        className="absolute right-2.5 h-3.5 w-3.5 text-body-soft"
        strokeWidth={2}
      />
    </button>
  );
}
