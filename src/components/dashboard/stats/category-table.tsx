import type { CategoryStat } from "@/lib/data/stats";

export function CategoryTable({ rows }: { rows: CategoryStat[] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.03]">
      <table className="w-full min-w-[480px] text-sm">
        <thead>
          <tr className="border-b border-white/10 text-left text-xs font-semibold uppercase tracking-wide text-white/40">
            <th className="px-4 py-3 font-semibold">Catégorie</th>
            <th className="px-4 py-3 font-semibold">Analyses</th>
            <th className="px-4 py-3 font-semibold">Précision</th>
            <th className="px-4 py-3 font-semibold">Edge moyen</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.category}
              className="border-b border-white/5 last:border-0"
            >
              <td className="px-4 py-3 font-medium text-white">
                {row.category}
              </td>
              <td className="px-4 py-3 text-white/70">{row.analysesCount}</td>
              <td className="px-4 py-3 text-white/70">{row.accuracy}%</td>
              <td className="px-4 py-3 text-emerald-400">
                +{row.averageEdge}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
