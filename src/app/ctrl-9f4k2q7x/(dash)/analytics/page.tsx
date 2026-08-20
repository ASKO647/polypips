import type { Metadata } from "next";
import { ExternalLink } from "lucide-react";
import { OwnerEmptyState } from "@/components/owner/empty-state";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function OwnerAnalyticsPage() {
  return (
    <div className="flex flex-col gap-5">
      <h1 className="font-display text-xl font-semibold text-white">Analytics</h1>
      <OwnerEmptyState
        title="Vercel Analytics collecte les données — pas encore affichées ici"
        reason={
          "@vercel/analytics est installé sur tout le trafic public + dashboard (une fois le " +
          "consentement cookies accepté), donc les pages vues, sessions et parcours sont bien " +
          "mesurés côté Vercel à partir de maintenant. Vercel expose une Web Analytics API " +
          "publique (lancée en 2026) pour intégrer ces chiffres ici, mais ça suppose un token " +
          "d'accès Vercel + l'ID du projet que je n'ai pas dans cet environnement — en attendant, " +
          "consulte-les directement sur le dashboard Vercel."
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
