import type { Metadata } from "next";
import { OwnerEmptyState } from "@/components/owner/empty-state";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function OwnerRealtimePage() {
  return (
    <div className="flex flex-col gap-5">
      <h1 className="font-display text-xl font-semibold text-white">Real-Time</h1>
      <OwnerEmptyState
        title="Aucune donnée de visiteurs en temps réel"
        reason="Un compteur de visiteurs en temps réel suppose un outil de tracking de trafic actif (voir Analytics). Sans lui, il n'existe aucun signal fiable de qui navigue le site en ce moment — afficher un chiffre ici serait inventé."
      />
    </div>
  );
}
