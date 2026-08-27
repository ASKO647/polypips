"use client";

import type { ComponentType } from "react";
import { CreditCard, KeyRound, User, Bell } from "lucide-react";
import { cn } from "@/lib/utils";

export type SettingsTabId = "profile" | "password" | "subscription" | "notifications";

const TABS: {
  id: SettingsTabId;
  label: string;
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
}[] = [
  { id: "profile", label: "Profil", icon: User },
  { id: "password", label: "Mot de passe", icon: KeyRound },
  { id: "subscription", label: "Abonnement", icon: CreditCard },
  { id: "notifications", label: "Notifications", icon: Bell },
];

export function SettingsTabs({
  active,
  onChange,
}: {
  active: SettingsTabId;
  onChange: (tab: SettingsTabId) => void;
}) {
  return (
    <div
      role="tablist"
      className="flex w-full gap-1 overflow-x-auto rounded-2xl border border-dash-border bg-dash-surface p-1.5"
    >
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={cn(
              "inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors duration-150",
              isActive
                ? "bg-dash-surface-strong text-dash-text"
                : "text-dash-text-tertiary hover:text-dash-text"
            )}
          >
            <Icon className="h-4 w-4" strokeWidth={2} />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
