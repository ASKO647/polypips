"use client";

import { useState } from "react";
import { Loader2, Search, Trophy } from "lucide-react";
import { Button, ButtonIcon } from "@/components/ui/button";
import { MatchCard } from "@/components/dashboard/sports/match-card";
import { SportsEmptyState } from "@/components/dashboard/sports/sports-empty-state";
import type { Match } from "@/lib/sports/types";

/**
 * Overview's real "recherche de match" — two team-name inputs, a real
 * search against the fixtures already synced in base (see
 * searchMatchesByTeams in lib/sports/service.ts), and a result list of
 * actual upcoming encounters with their real dates. Replaces the old
 * single free-text "Match / participants" field, which only named a bet
 * someone had already decided on — this one finds the fixture for you.
 * Clicking a result's "Voir l'analyse" (MatchCard, unchanged) opens that
 * match's own Match Center page — that page's Polypips Score/H2H/forme
 * tabs are the "lance l'analyse" step, no separate action needed here.
 */
export function TeamSearchPanel() {
  const [teamA, setTeamA] = useState("");
  const [teamB, setTeamB] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<Match[] | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const a = teamA.trim();
    const b = teamB.trim();
    if (!a || !b) {
      setError("Indiquez les deux équipes recherchées.");
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);
    try {
      const response = await fetch(
        `/api/sports/search-matches?teamA=${encodeURIComponent(a)}&teamB=${encodeURIComponent(b)}`
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Impossible de lancer la recherche.");
      setResults(data.matches as Match[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
      <div>
        <p className="text-sm font-semibold text-white">Rechercher un match</p>
        <p className="mt-1 text-xs text-white/45">
          Indiquez deux équipes pour retrouver leurs prochaines rencontres, avec les vraies dates.
        </p>
      </div>

      <form onSubmit={handleSearch} className="flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          value={teamA}
          onChange={(e) => setTeamA(e.target.value)}
          placeholder="Équipe 1 (ex: PSG)"
          disabled={loading}
          className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-white/25 focus:outline-none disabled:opacity-50"
        />
        <span className="hidden items-center px-1 text-xs font-bold uppercase text-white/30 sm:flex">vs</span>
        <input
          type="text"
          value={teamB}
          onChange={(e) => setTeamB(e.target.value)}
          placeholder="Équipe 2 (ex: Marseille)"
          disabled={loading}
          className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-white/25 focus:outline-none disabled:opacity-50"
        />
        <Button type="submit" disabled={loading || !teamA.trim() || !teamB.trim()}>
          {loading ? "Recherche..." : "Rechercher"}
          <ButtonIcon>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}</ButtonIcon>
        </Button>
      </form>

      {error && <p className="text-xs text-rose-400">{error}</p>}

      {results && (
        <div className="border-t border-white/10 pt-4">
          {results.length === 0 ? (
            <SportsEmptyState
              icon={Trophy}
              title="Aucune rencontre trouvée"
              message="Vérifiez l'orthographe des équipes, ou réessayez plus tard — de nouvelles rencontres sont ajoutées à chaque synchronisation."
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((match) => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
