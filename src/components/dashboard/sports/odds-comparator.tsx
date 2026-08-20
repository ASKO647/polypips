import { Landmark } from "lucide-react";
import type { BookmakerOdds, Match } from "@/lib/sports/types";

/**
 * Renders the real bookmaker-odds table once a legitimate odds source is
 * connected — until then, an honest empty state instead of the
 * illustrative numbers a design mockup might show. Never fabricate an
 * odds figure here.
 */
export function OddsComparator({ match, odds }: { match: Match; odds: BookmakerOdds[] }) {
  if (odds.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-6 py-10 text-center">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.06] text-white/40">
          <Landmark className="h-4.5 w-4.5" strokeWidth={2} />
        </span>
        <p className="text-sm font-semibold text-white">Comparateur de cotes</p>
        <p className="max-w-xs text-xs leading-relaxed text-white/40">
          Aucune source de cotes n&apos;est encore connectée. Cette section affichera les cotes réelles
          de plusieurs bookmakers, avec la meilleure cote mise en évidence, dès qu&apos;une source
          légitime sera branchée.
        </p>
      </div>
    );
  }

  const bestHome = Math.max(...odds.map((o) => o.home));
  const bestDraw = Math.max(...odds.map((o) => o.draw));
  const bestAway = Math.max(...odds.map((o) => o.away));

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <h3 className="font-display text-sm font-semibold text-white">Comparateur de cotes</h3>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[360px] text-left text-xs">
          <thead>
            <tr className="text-white/40">
              <th className="pb-2 font-medium">Bookmaker</th>
              <th className="pb-2 font-medium">{match.homeTeam.shortName}</th>
              <th className="pb-2 font-medium">Nul</th>
              <th className="pb-2 font-medium">{match.awayTeam.shortName}</th>
            </tr>
          </thead>
          <tbody>
            {odds.map((row) => (
              <tr key={row.bookmaker} className="border-t border-white/5">
                <td className="py-2 font-semibold text-white">{row.bookmaker}</td>
                <td className={`py-2 ${row.home === bestHome ? "font-bold text-emerald-400" : "text-white/70"}`}>
                  {row.home.toFixed(2)}
                </td>
                <td className={`py-2 ${row.draw === bestDraw ? "font-bold text-emerald-400" : "text-white/70"}`}>
                  {row.draw.toFixed(2)}
                </td>
                <td className={`py-2 ${row.away === bestAway ? "font-bold text-emerald-400" : "text-white/70"}`}>
                  {row.away.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
