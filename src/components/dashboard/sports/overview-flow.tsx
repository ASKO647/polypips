"use client";

import { useMemo, useState } from "react";
import { BarChart3, Flame, ShieldCheck, Target, Trophy } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { MatchCard } from "@/components/dashboard/sports/match-card";
import { SportsEmptyState } from "@/components/dashboard/sports/sports-empty-state";
import { StatTile } from "@/components/dashboard/sports/stat-tile";
import type { Match, SportsOverviewStats } from "@/lib/sports/types";
import { cn } from "@/lib/utils";

type QuickFilter = "all" | "opportunities" | "football" | "basketball" | "tennis" | "today" | "tomorrow" | "week";

const QUICK_FILTERS: { key: QuickFilter; label: string }[] = [
  { key: "all", label: "Tous" },
  { key: "opportunities", label: "Opportunités" },
  { key: "football", label: "Football" },
  { key: "basketball", label: "Basketball" },
  { key: "tennis", label: "Tennis" },
  { key: "today", label: "Aujourd'hui" },
  { key: "tomorrow", label: "Demain" },
  { key: "week", label: "Cette semaine" },
];

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function filterMatches(matches: Match[], filter: QuickFilter): Match[] {
  if (filter === "all") return matches;
  if (filter === "opportunities") return [];
  if (filter === "football" || filter === "basketball" || filter === "tennis") {
    return matches.filter((m) => m.sport === filter);
  }
  const now = new Date();
  if (filter === "today") {
    return matches.filter((m) => isSameDay(new Date(m.kickoffAt), now));
  }
  if (filter === "tomorrow") {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return matches.filter((m) => isSameDay(new Date(m.kickoffAt), tomorrow));
  }
  const weekEnd = new Date(now);
  weekEnd.setDate(weekEnd.getDate() + 7);
  return matches.filter((m) => new Date(m.kickoffAt) <= weekEnd);
}

export function OverviewFlow({
  firstName,
  stats,
  matches,
}: {
  firstName: string | null;
  stats: SportsOverviewStats;
  matches: Match[];
}) {
  const [filter, setFilter] = useState<QuickFilter>("all");

  const filtered = useMemo(() => filterMatches(matches, filter), [matches, filter]);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Bonjour{firstName ? ` ${firstName}` : ""} !
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-white/50 sm:text-base">
          Votre aperçu sportif du jour — probabilités, statistiques et analyse IA.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          icon={BarChart3}
          label="Matchs analysés aujourd'hui"
          value={stats.matchesAnalyzedToday}
        />
        <StatTile
          icon={Flame}
          label="Opportunités détectées"
          value={stats.opportunitiesDetectedToday}
          tone="brand"
        />
        <StatTile
          icon={Target}
          label="Fortes convictions"
          value={stats.highConvictionCount}
          caption="Confiance ≥ 60%"
        />
        <StatTile
          icon={ShieldCheck}
          label="Précision modèle"
          value={stats.modelAccuracy.precisionPercent === null ? null : `${stats.modelAccuracy.precisionPercent}%`}
          caption={
            stats.modelAccuracy.precisionPercent === null
              ? "Pas encore de données"
              : `${stats.modelAccuracy.windowDays} derniers jours`
          }
          tone="emerald"
        />
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-base font-bold text-white">Top opportunités</h2>
          <Link
            href="/dashboard/sports/opportunites"
            className="text-xs font-semibold text-white/45 transition-colors hover:text-white"
          >
            Voir tout
          </Link>
        </div>
        <SportsEmptyState
          icon={Flame}
          title="Aucune opportunité détectée pour l'instant"
          message="Le moteur de détection d'opportunités n'est pas encore connecté à une vraie source de données. Cette section s'activera automatiquement dès qu'il le sera."
          compact
        />
      </div>

      <div>
        <h2 className="mb-3 font-display text-base font-bold text-white">Tous les matchs</h2>

        <div className="mb-4 flex flex-wrap gap-2">
          {QUICK_FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors duration-150",
                filter === f.key
                  ? "border-brand-400 bg-brand-500/15 text-brand-400"
                  : "border-white/10 bg-white/[0.03] text-white/55 hover:border-white/20 hover:text-white"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <SportsEmptyState
            icon={Trophy}
            title="Aucun match pour ce filtre"
            message="Essayez un autre filtre, ou revenez plus tard pour voir de nouvelles rencontres."
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
