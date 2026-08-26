import type { Metadata } from "next";
import { Hand } from "lucide-react";
import { FlagIcon } from "@/components/dashboard/sports/flag-icon";
import { FollowTeamButton } from "@/components/dashboard/sports/follow-team-button";
import { SportsEmptyState } from "@/components/dashboard/sports/sports-empty-state";
import { TeamBadge } from "@/components/dashboard/sports/team-badge";
import { createClient, getAuthUser } from "@/lib/supabase/server";
import { fetchFollowedTeamIds } from "@/lib/supabase/sports-follows";
import { getCountryCode, getTeamById } from "@/lib/sports/service";
import type { Team } from "@/lib/sports/types";

export const metadata: Metadata = {
  title: "Mes équipes — Sports — Polypips",
};

export default async function MesEquipesPage() {
  const supabase = await createClient();
  const user = await getAuthUser();
  const followedIds = await fetchFollowedTeamIds(supabase, user?.id ?? null);

  // Resolved by id, one per followed team — not listTeams()+filter, which
  // silently drops every individual-sport (tennis/boxing/MMA) follow since
  // sports_teams_cache structurally has no rows for those. See
  // getTeamById's own comment for why.
  const teams = (
    await Promise.all(Array.from(followedIds).map((id) => getTeamById(id)))
  ).filter((t): t is Team => t !== null);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Mes équipes
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-white/50 sm:text-base">
          Les équipes que vous suivez.
        </p>
      </div>

      {teams.length === 0 ? (
        <SportsEmptyState
          icon={Hand}
          title="Vous ne suivez aucune équipe"
          message="Cliquez sur l'étoile à côté d'une équipe, depuis une fiche match, pour la retrouver ici."
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => (
            <div
              key={team.id}
              className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4"
            >
              <div className="flex items-center gap-3">
                <TeamBadge team={team} size="sm" />
                <div>
                  <p className="text-sm font-semibold text-white">{team.name}</p>
                  <p className="flex items-center gap-1.5 text-xs text-white/40">
                    <FlagIcon code={getCountryCode(team.country)} className="h-3 w-[18px]" />
                    {team.country}
                  </p>
                </div>
              </div>
              <FollowTeamButton
                teamId={team.id}
                teamName={team.name}
                initialFollowed
                size="sm"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
