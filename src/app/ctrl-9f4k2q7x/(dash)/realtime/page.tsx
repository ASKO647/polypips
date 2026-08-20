import type { Metadata } from "next";
import { ExternalLink } from "lucide-react";
import { OwnerEmptyState } from "@/components/owner/empty-state";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function OwnerRealtimePage() {
  return (
    <div className="flex flex-col gap-5">
      <h1 className="font-display text-xl font-semibold text-white">Real-Time</h1>
      <OwnerEmptyState
        title="Pas de compteur temps réel intégré ici"
        reason={
          "Le dashboard Vercel Analytics affiche déjà les visiteurs actifs en temps réel une " +
          "fois Web Analytics activé sur le projet. Reconstruire ce même compteur ici demanderait " +
          "d'interroger l'API Web Analytics de Vercel en polling — possible en théorie (l'API " +
          "existe, voir la page Analytics), mais un vrai indicateur \"live\" ajouterait de la " +
          "complexité pour dupliquer une vue déjà disponible côté Vercel — plus simple d'ouvrir " +
          "directement le dashboard."
        }
        action={
          <a
            href="https://vercel.com/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-[#0b0d10] hover:bg-cyan-400"
          >
            Ouvrir le dashboard Vercel
            <ExternalLink className="h-4 w-4" strokeWidth={2} />
          </a>
        }
      />
    </div>
  );
}
