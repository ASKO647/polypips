"use client";

import { useState } from "react";
import { Flame, SlidersHorizontal } from "lucide-react";
import { FiltersDrawer } from "@/components/dashboard/sports/filters-drawer";
import { PillSelect } from "@/components/dashboard/sports/pill-select";
import { SportsEmptyState } from "@/components/dashboard/sports/sports-empty-state";
import { ACTIVE_SPORT_CATEGORIES, SPORT_EMOJIS } from "@/lib/sports/nav";
import type { Competition } from "@/lib/sports/types";
import { cn } from "@/lib/utils";

const CONFIDENCE_OPTIONS = [
  { label: "Toute confiance", value: "0" },
  { label: "Confiance > 50%", value: "50" },
  { label: "Confiance > 60%", value: "60" },
  { label: "Confiance > 70%", value: "70" },
  { label: "Confiance > 80%", value: "80" },
];

export function OpportunitiesFlow({ competitions }: { competitions: Competition[] }) {
  const [sport, setSport] = useState<string>("all");
  const [minConfidence, setMinConfidence] = useState("0");
  const [competitionId, setCompetitionId] = useState<string>("all");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const competitionOptions = [
    { label: "Toutes compétitions", value: "all" },
    ...competitions.map((c) => ({ label: c.name, value: c.id })),
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Opportunités
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-white/50 sm:text-base">
          Les meilleures opportunités détectées, tous sports et matchs confondus.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setSport("all")}
          className={cn(
            "rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors duration-150",
            sport === "all"
              ? "border-brand-400 bg-brand-500/15 text-brand-400"
              : "border-white/10 bg-white/[0.03] text-white/55 hover:border-white/20 hover:text-white"
          )}
        >
          Tous
        </button>
        {ACTIVE_SPORT_CATEGORIES.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => setSport(s.key)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors duration-150",
              sport === s.key
                ? "border-brand-400 bg-brand-500/15 text-brand-400"
                : "border-white/10 bg-white/[0.03] text-white/55 hover:border-white/20 hover:text-white"
            )}
          >
            <span aria-hidden>{SPORT_EMOJIS[s.key]}</span>
            {s.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <PillSelect value={minConfidence} options={CONFIDENCE_OPTIONS} onChange={setMinConfidence} />
        <PillSelect value={competitionId} options={competitionOptions} onChange={setCompetitionId} />
        <button
          type="button"
          onClick={() => setFiltersOpen(true)}
          className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5 text-xs font-semibold text-white/70 transition-colors hover:border-white/20 hover:text-white"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" strokeWidth={2} />
          Filtres avancés
        </button>
      </div>

      <SportsEmptyState
        icon={Flame}
        title="Aucune opportunité pour l'instant"
        message="Le moteur de détection d'opportunités Polypips n'est pas encore connecté à une vraie source de données sportives. Cette liste s'activera automatiquement dès qu'une source de statistiques/résultats sera branchée — aucune opportunité factice n'est affichée en attendant."
      />

      <FiltersDrawer
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        competitions={competitions}
        resultCount={0}
      />
    </div>
  );
}
