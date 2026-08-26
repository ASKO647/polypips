import type { Metadata } from "next";
import { TutorialFlow } from "@/components/dashboard/smart-wallets/tutorial-flow";
import { createClient, getAuthUser } from "@/lib/supabase/server";
import { fetchAllSignalCopySettings } from "@/lib/supabase/signal-copy-trading";

export const metadata: Metadata = {
  title: "Comment connecter PolyPips à Fomo & Axiom — Polypips",
};

/** Replaces the old dedicated "Paramètres Copy Trading" page in the
 * sidebar — the underlying settings themselves (signal_copy_settings,
 * CopySettingsForm) are untouched and still reachable inline from "Mes
 * Smart Wallets"; only the separate settings-overview page was removed.
 * hasActiveCopyTrading is the one genuinely live signal on this page —
 * see ConnectionsStatusCard's file comment for why Axiom/Fomo/Wallet
 * never get a real green state today. */
export default async function FomoAxiomTutorialPage() {
  const user = await getAuthUser();
  if (!user) return <TutorialFlow hasActiveCopyTrading={false} />;

  const supabase = await createClient();
  const settings = await fetchAllSignalCopySettings(supabase, user.id);
  const hasActiveCopyTrading = Array.from(settings.values()).some((s) => s.enabled);

  return <TutorialFlow hasActiveCopyTrading={hasActiveCopyTrading} />;
}
