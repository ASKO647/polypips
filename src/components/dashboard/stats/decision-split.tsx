import type { DecisionSplitData } from "@/lib/data/stats";

/** "Issue principale/secondaire" — the market's first-/second-listed real
 * outcome label, not a literal "YES"/"NO": most markets use those words,
 * but a real minority (crypto price markets chief among them) use
 * different pairs like "Up"/"Down" on the exact same market shape, and
 * this stat spans every market a user has ever had resolved, each with
 * its own labels — see lib/data/analysis.ts's isPrimaryDecision. */
export function DecisionSplit({ split }: { split: DecisionSplitData }) {
  const total = split.primaryCount + split.secondaryCount;
  const primaryPct = Math.round((split.primaryCount / total) * 100);
  const secondaryPct = 100 - primaryPct;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-white/40">
        Répartition des décisions
      </p>

      <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-white/10">
        <div className="h-full bg-emerald-400" style={{ width: `${primaryPct}%` }} />
        <div className="h-full bg-rose-400" style={{ width: `${secondaryPct}%` }} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <p className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Issue principale — {primaryPct}%
          </p>
          <p className="mt-1 text-sm text-white/60">
            {split.primaryCount} analyses · {split.primaryAccuracy}% de précision
          </p>
        </div>
        <div>
          <p className="flex items-center gap-1.5 text-xs font-semibold text-rose-400">
            <span className="h-2 w-2 rounded-full bg-rose-400" />
            Issue secondaire — {secondaryPct}%
          </p>
          <p className="mt-1 text-sm text-white/60">
            {split.secondaryCount} analyses · {split.secondaryAccuracy}% de précision
          </p>
        </div>
      </div>
    </div>
  );
}
