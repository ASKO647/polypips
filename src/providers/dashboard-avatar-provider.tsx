"use client";

import { createContext, useContext, type ReactNode } from "react";

/** Avoids prop-drilling avatarUrl through every immersive-route flow
 * component (markets, trading, sports, analyse IA, Smart Wallet, settings
 * all render their own copy of the dashboard chrome via DashboardChrome,
 * and /dashboard itself via its own inline copy in
 * dashboard-overview-flow.tsx) just so the two of them that show an
 * avatar — the header pill and the sidebar's bottom user block — can read
 * it. DashboardShell already receives the real value from
 * dashboard/layout.tsx (a Server Component reading user_metadata.avatar_url)
 * and is the single ancestor of every dashboard route, so it provides this
 * context once and the chrome components read it directly. */
const DashboardAvatarContext = createContext<string | null>(null);

export function DashboardAvatarProvider({
  avatarUrl,
  children,
}: {
  avatarUrl: string | null;
  children: ReactNode;
}) {
  return (
    <DashboardAvatarContext.Provider value={avatarUrl}>
      {children}
    </DashboardAvatarContext.Provider>
  );
}

export function useDashboardAvatar(): string | null {
  return useContext(DashboardAvatarContext);
}
