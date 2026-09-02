"use client";

import { Loader2, Search } from "lucide-react";
import { Button, ButtonIcon } from "@/components/ui/button";
import { SPORT_LABELS, type Sport } from "@/lib/sports/types";
import { cn } from "@/lib/utils";

const SPORTS: Sport[] = ["football", "basketball", "tennis"];

/** Field labels/placeholders read very differently for a team sport
 * ("Équipe") vs an individual one ("Joueur") — hardcoded per sport rather
 * than a single generic "Équipe / joueur" wording, and updated live as the
 * user switches sport. Placeholders are illustrative examples only (never
 * submitted as a default value), so a since-retired tennis player here
 * wouldn't break anything — but picked to stay plausible for a while:
 * established, still-active top names rather than a specific tournament's
 * current draw. */
const SEARCH_FIELDS: Record<Sport, { label1: string; label2: string; placeholder1: string; placeholder2: string }> = {
  football: {
    label1: "Équipe 1",
    label2: "Équipe 2",
    placeholder1: "Barcelone, PSG...",
    placeholder2: "Bayern, Real Madrid...",
  },
  basketball: {
    label1: "Équipe 1",
    label2: "Équipe 2",
    placeholder1: "Lakers...",
    placeholder2: "Warriors...",
  },
  tennis: {
    label1: "Joueur 1",
    label2: "Joueur 2",
    placeholder1: "Alcaraz...",
    placeholder2: "Sinner...",
  },
};

export function SportMatchSearchPanel({
  sport,
  onSportChange,
  team1,
  onTeam1Change,
  team2,
  onTeam2Change,
  loading,
  errorMessage,
  onSearch,
}: {
  sport: Sport;
  onSportChange: (sport: Sport) => void;
  team1: string;
  onTeam1Change: (value: string) => void;
  team2: string;
  onTeam2Change: (value: string) => void;
  loading: boolean;
  errorMessage: string | null;
  onSearch: () => void;
}) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch();
  };

  return (
    <div className="flex flex-col gap-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
      <div>
        <p className="text-sm font-semibold text-white">Analyse IA — Sport</p>
        <p className="mt-1 text-xs text-white/45">
          Tapez deux équipes (ou deux joueurs pour le tennis) : l&apos;IA cherche leurs prochaines
          confrontations réelles et vous laisse choisir celle à analyser.
        </p>
      </div>

      <div className="flex gap-2">
        {SPORTS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onSportChange(s)}
            className={cn(
              "flex-1 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors duration-150",
              sport === s
                ? "border-brand-400 bg-brand-500/15 text-brand-400"
                : "border-white/10 bg-white/[0.02] text-white/50 hover:border-white/25 hover:text-white"
            )}
          >
            {SPORT_LABELS[s]}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="sport-search-team1" className="text-xs font-medium text-white/50">
              {SEARCH_FIELDS[sport].label1}
            </label>
            <input
              id="sport-search-team1"
              type="text"
              value={team1}
              onChange={(e) => onTeam1Change(e.target.value)}
              placeholder={SEARCH_FIELDS[sport].placeholder1}
              disabled={loading}
              className="min-w-0 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-white/25 focus:outline-none disabled:opacity-50"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="sport-search-team2" className="text-xs font-medium text-white/50">
              {SEARCH_FIELDS[sport].label2}
            </label>
            <input
              id="sport-search-team2"
              type="text"
              value={team2}
              onChange={(e) => onTeam2Change(e.target.value)}
              placeholder={SEARCH_FIELDS[sport].placeholder2}
              disabled={loading}
              className="min-w-0 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-white/25 focus:outline-none disabled:opacity-50"
            />
          </div>
        </div>
        <Button type="submit" disabled={loading || !team1.trim() || !team2.trim()}>
          {loading ? "Recherche..." : "Chercher les prochaines confrontations"}
          <ButtonIcon>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}</ButtonIcon>
        </Button>
      </form>

      {errorMessage && <p className="text-xs text-rose-400">{errorMessage}</p>}
    </div>
  );
}
