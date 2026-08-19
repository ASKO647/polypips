import type { Metadata } from "next";
import { OwnerEmptyState } from "@/components/owner/empty-state";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function OwnerAnalyticsPage() {
  return (
    <div className="flex flex-col gap-5">
      <h1 className="font-display text-xl font-semibold text-white">Analytics</h1>
      <OwnerEmptyState
        title="Aucun outil d'analytics installé"
        reason="Le projet n'a aucune dépendance ni script de tracking de trafic (Google Analytics, Plausible, PostHog, Vercel Analytics...). Pages vues, sessions, taux de rebond et parcours de navigation ne sont mesurés nulle part aujourd'hui — cette page ne peut afficher aucun chiffre réel tant qu'un outil n'est pas ajouté."
      />
    </div>
  );
}
