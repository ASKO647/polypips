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
        "relative inline-flex h-9 w-[4.25rem] items-center rounded-full border border-border-strong bg-surface-muted px-1 transition-colors",
        className
      )}
    >
      <span
        className={cn(
          "flex h-7 w-7 items-center justify-center rounded-full bg-surface shadow-sm transition-transform duration-300 ease-out",
          isDark ? "translate-x-[1.9rem]" : "translate-x-0"
        )}
      >
        {isDark ? (
          <Moon className="h-3.5 w-3.5 text-brand-500" strokeWidth={2.25} />
        ) : (
          <Sun className="h-3.5 w-3.5 text-brand-500" strokeWidth={2.25} />
        )}
      </span>
      <Sun
        className="absolute left-2 h-3.5 w-3.5 text-body-soft"
        strokeWidth={2}
      />
      <Moon
        className="absolute right-2 h-3.5 w-3.5 text-body-soft"
        strokeWidth={2}
      />
    </button>
  );
}
