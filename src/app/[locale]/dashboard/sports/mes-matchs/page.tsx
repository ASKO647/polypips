import type { Metadata } from "next";
import { Star } from "lucide-react";
import { MatchCard } from "@/components/dashboard/sports/match-card";
import { SportsEmptyState } from "@/components/dashboard/sports/sports-empty-state";
import { createClient, getAuthUser } from "@/lib/supabase/server";
import { fetchFollowedMatchIds } from "@/lib/supabase/sports-follows";
import { getMatchById } from "@/lib/sports/service";
import type { Match } from "@/lib/sports/types";

export const metadata: Metadata = {
  title: "Mes matchs — Sports — Polypips",
};

export default async function MesMatchsPage() {
  const supabase = await createClient();
  const user = await getAuthUser();
  const followedIds = await fetchFollowedMatchIds(supabase, user?.id ?? null);

  const matches = (
    await Promise.all(Array.from(followedIds).map((id) => getMatchById(id)))
  ).filter((m): m is Match => m !== null);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Mes matchs
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-white/50 sm:text-base">
          Les matchs que vous suivez.
        </p>
      </div>

      {matches.length === 0 ? (
        <SportsEmptyState
          icon={Star}
          title="Vous ne suivez aucun match"
          message="Cliquez sur « Suivre ce match » depuis n'importe quelle fiche match pour le retrouver ici."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {matches.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      )}
    </div>
  );
}
