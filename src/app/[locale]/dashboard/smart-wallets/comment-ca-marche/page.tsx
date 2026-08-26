import type { Metadata } from "next";
import { HowItWorksFlow } from "@/components/dashboard/smart-wallets/how-it-works-flow";
import { createClient, getAuthUser } from "@/lib/supabase/server";
import { fetchAllSignalCopySettings } from "@/lib/supabase/signal-copy-trading";

export const metadata: Metadata = {
  title: "Comment ça marche — Fomo X Axiom — Polypips",
};

/** Replaces the old "Comment connecter PolyPips à Fomo & Axiom" tutorial
 * page in the sidebar — same position in the nav, genuinely different
 * content: no connection/authorization concept remains. */
export default async function HowItWorksPage() {
  const user = await getAuthUser();
  if (!user) return <HowItWorksFlow hasActiveCopyTrading={false} />;

  const supabase = await createClient();
  const settings = await fetchAllSignalCopySettings(supabase, user.id);
  const hasActiveCopyTrading = Array.from(settings.values()).some((s) => s.enabled);

  return <HowItWorksFlow hasActiveCopyTrading={hasActiveCopyTrading} />;
}
