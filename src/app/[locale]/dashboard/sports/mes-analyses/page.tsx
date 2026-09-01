import type { Metadata } from "next";
import { SportAnalysesHistory } from "@/components/dashboard/sports/sport-analyses-history";
import { createClient } from "@/lib/supabase/server";
import { fetchRecentSportAnalyses } from "@/lib/supabase/sports-analyses";

export const metadata: Metadata = {
  title: "Sport — Mes analyses — Polypips",
};

export default async function SportMesAnalysesPage() {
  const supabase = await createClient();
  const analyses = await fetchRecentSportAnalyses(supabase, 50);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-display text-xl font-bold text-white sm:text-2xl">Mes analyses</h1>
        <p className="mt-1 text-sm text-white/45">
          L&apos;historique complet de vos pronostics sport, avec accès à chaque analyse détaillée.
        </p>
      </div>
      <SportAnalysesHistory analyses={analyses} />
    </div>
  );
}
