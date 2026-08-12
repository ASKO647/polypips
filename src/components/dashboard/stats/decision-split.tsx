import type { DecisionSplitData } from "@/lib/data/stats";

export function DecisionSplit({ split }: { split: DecisionSplitData }) {
  const total = split.yesCount + split.noCount;
  const yesPct = Math.round((split.yesCount / total) * 100);
  const noPct = 100 - yesPct;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-white/40">
        Répartition des décisions
      </p>

      <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-white/10">
        <div className="h-full bg-emerald-400" style={{ width: `${yesPct}%` }} />
        <div className="h-full bg-rose-400" style={{ width: `${noPct}%` }} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <p className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            YES — {yesPct}%
          </p>
          <p className="mt-1 text-sm text-white/60">
            {split.yesCount} analyses · {split.yesAccuracy}% de précision
          </p>
        </div>
        <div>
          <p className="flex items-center gap-1.5 text-xs font-semibold text-rose-400">
            <span className="h-2 w-2 rounded-full bg-rose-400" />
            NO — {noPct}%
          </p>
          <p className="mt-1 text-sm text-white/60">
            {split.noCount} analyses · {split.noAccuracy}% de précision
          </p>
        </div>
      </div>
    </div>
  );
}
