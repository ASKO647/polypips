"use client";

import { useState } from "react";
import { Clock } from "lucide-react";
import { SportMatchResult } from "@/components/dashboard/sports/sport-match-result";
import type { SportMatchAnalysis } from "@/lib/data/sports-analysis";
import { cn } from "@/lib/utils";

function HistoryRow({
  analysis,
  onSelect,
}: {
  analysis: SportMatchAnalysis;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex w-full items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5 text-left transition-colors duration-150 hover:border-white/20 hover:bg-white/[0.05]"
    >
      <div className="flex min-w-0 flex-col gap-1">
        <p className="truncate text-sm font-medium text-white">{analysis.participants}</p>
        <span className="flex items-center gap-1.5 text-xs text-white/40">
          <Clock className="h-3 w-3" />
          {analysis.analyzedAt}
          {analysis.competition ? ` · ${analysis.competition}` : ""}
        </span>
      </div>
      <span
        className={cn(
          "shrink-0 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-bold text-emerald-400"
        )}
      >
        {analysis.predictedWinner} · {analysis.aiProbability}%
      </span>
    </button>
  );
}

export function SportAnalysesHistory({ analyses }: { analyses: SportMatchAnalysis[] }) {
  const [selected, setSelected] = useState<SportMatchAnalysis | null>(null);

  if (selected) {
    return (
      <SportMatchResult
        analysis={selected}
        onBack={() => setSelected(null)}
        backLabel="Retour à la liste"
      />
    );
  }

  if (analyses.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-white/10 px-6 py-16 text-center">
        <p className="text-sm font-medium text-white/60">Aucune analyse pour le moment</p>
        <p className="max-w-sm text-xs text-white/35">
          Lancez une recherche depuis Analyse IA pour voir vos pronostics apparaître ici.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {analyses.map((analysis) => (
        <HistoryRow key={analysis.id} analysis={analysis} onSelect={() => setSelected(analysis)} />
      ))}
    </div>
  );
}
