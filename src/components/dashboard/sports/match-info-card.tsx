import type { Match, MatchInfo } from "@/lib/sports/types";

const KICKOFF_FORMAT = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

function InfoRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-white/40">{label}</span>
      <span className={value ? "font-medium text-white" : "text-white/30"}>
        {value ?? "Non disponible"}
      </span>
    </div>
  );
}

export function MatchInfoCard({ match, info }: { match: Match; info: MatchInfo }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <h3 className="font-display text-sm font-semibold text-white">Info match</h3>
      <div className="flex flex-col gap-2.5">
        <InfoRow label="Stade" value={info.venue} />
        <InfoRow label="Météo" value={info.weather} />
        <InfoRow label="Arbitre" value={info.referee} />
        <InfoRow
          label="Affluence estimée"
          value={info.attendanceEstimate !== null ? info.attendanceEstimate.toLocaleString("fr-FR") : null}
        />
        <InfoRow label="Coup d'envoi" value={KICKOFF_FORMAT.format(new Date(match.kickoffAt))} />
        <InfoRow label="Compétition" value={match.competition.name} />
      </div>
    </div>
  );
}
