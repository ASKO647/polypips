import type { H2HMatch } from "@/lib/sports/types";

const DATE_FORMAT = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });

export function H2HListCard({
  h2h,
  title = "Face à face (5 derniers)",
  limit,
}: {
  h2h: H2HMatch[];
  title?: string;
  limit?: number;
}) {
  const rows = limit ? h2h.slice(0, limit) : h2h;

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <h3 className="font-display text-sm font-semibold text-white">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-xs text-white/40">Aucune confrontation directe récente.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {rows.map((match) => (
            <div key={match.id} className="flex items-center justify-between gap-2 text-xs">
              <span className="text-white/40">{DATE_FORMAT.format(new Date(match.playedAt))}</span>
              <span className="flex-1 truncate px-2 text-center font-medium text-white">
                {match.homeTeam}
              </span>
              <span className="rounded-md bg-white/[0.06] px-2 py-1 font-bold text-white">
                {match.homeScore} - {match.awayScore}
              </span>
              <span className="flex-1 truncate px-2 text-center font-medium text-white">
                {match.awayTeam}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
