import { ExternalLink } from "lucide-react";
import { EventIcon } from "@/components/dashboard/pips-tracks/event-icon";
import { cn } from "@/lib/utils";
import {
  PIPS_TRACK_IMPACT_LABELS,
  PIPS_TRACK_SOURCE_LABELS,
  type PipsTrackEvent,
} from "@/lib/data/pips-tracks";

const IMPACT_STYLES: Record<NonNullable<PipsTrackEvent["aiImpact"]>, string> = {
  eleve: "bg-amber-500/15 text-amber-400",
  moyen: "bg-white/[0.06] text-white/60",
  faible: "bg-white/[0.04] text-white/35",
};

function formatAmount(amountUsd: number): string {
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(amountUsd) + " $";
}

function formatTime(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(
    new Date(iso)
  );
}

/** Right-side block — varies by event type, exactly like the mockup: a
 * token/amount block for trades, a score+impact block for Signal IA, an
 * external-link button for X/News (once those sources exist), a bare
 * score for a wallet reactivation. */
function EventRightBlock({ event }: { event: PipsTrackEvent }) {
  if (event.eventType === "signal_ia") {
    return (
      <div className="flex shrink-0 flex-col items-end gap-1.5 text-right">
        {event.aiScore !== null && (
          <p className="text-sm font-bold text-white">
            <span className="text-white/40">Score</span> {event.aiScore}/100
          </p>
        )}
        {event.aiImpact && (
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
              IMPACT_STYLES[event.aiImpact]
            )}
          >
            {PIPS_TRACK_IMPACT_LABELS[event.aiImpact]}
          </span>
        )}
      </div>
    );
  }

  if (event.eventType === "news" || event.eventType === "x_post") {
    return (
      <a
        href={event.externalUrl ?? "#"}
        target="_blank"
        rel="noreferrer"
        className="flex shrink-0 items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold text-white/70 transition-colors hover:border-white/25 hover:text-white"
      >
        {event.eventType === "x_post" ? "Voir le post" : "Voir l'article"}
        <ExternalLink className="h-3 w-3" strokeWidth={2} />
      </a>
    );
  }

  if (event.tokenSymbol || event.amountUsd !== null) {
    return (
      <div className="flex shrink-0 flex-col items-end gap-1 text-right">
        {event.tokenSymbol && <p className="text-sm font-bold text-white">${event.tokenSymbol}</p>}
        {event.amountUsd !== null && <p className="text-xs text-white/50">{formatAmount(event.amountUsd)}</p>}
      </div>
    );
  }

  return null;
}

export function EventCard({ event, isNew }: { event: PipsTrackEvent; isNew?: boolean }) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition-colors duration-150",
        isNew && "border-brand-400/40 bg-brand-500/[0.04]"
      )}
    >
      <EventIcon eventType={event.eventType} />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-medium text-white/35">{formatTime(event.occurredAt)}</span>
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white/50">
            {PIPS_TRACK_SOURCE_LABELS[event.source]}
          </span>
          {event.dataSourceMode === "mock" && (
            <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-400">
              Démo
            </span>
          )}
        </div>
        <p className="mt-1.5 text-sm font-bold text-white">{event.title}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-white/50">{event.description}</p>
      </div>

      <EventRightBlock event={event} />
    </div>
  );
}
