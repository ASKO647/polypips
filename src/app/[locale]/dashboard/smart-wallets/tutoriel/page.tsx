import type { Metadata } from "next";
import { TutorialFlow } from "@/components/dashboard/smart-wallets/tutorial-flow";

export const metadata: Metadata = {
  title: "Comment connecter PolyPips à Fomo & Axiom — Polypips",
};

/** Replaces the old dedicated "Paramètres Copy Trading" page in the
 * sidebar — the underlying settings themselves (signal_copy_settings,
 * CopySettingsForm) are untouched and still reachable inline from "Mes
 * Smart Wallets"; only the separate settings-overview page was removed. */
export default function FomoAxiomTutorialPage() {
  return <TutorialFlow />;
}
