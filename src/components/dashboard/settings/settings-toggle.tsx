"use client";

import { cn } from "@/lib/utils";

export function SettingsToggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className="flex w-full items-center justify-between gap-4 rounded-xl border border-dash-border bg-dash-surface-alt px-4 py-3.5 text-left transition-colors duration-150 hover:border-dash-border-strong"
    >
      <span className="text-sm font-medium text-dash-text">{label}</span>
      <span
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200",
          checked ? "bg-brand-500" : "bg-dash-surface-strong"
        )}
      >
        <span
          className={cn(
            "absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200",
            checked && "translate-x-5"
          )}
        />
      </span>
    </button>
  );
}
