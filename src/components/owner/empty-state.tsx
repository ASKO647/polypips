import { AlertTriangle } from "lucide-react";

/** Used by Analytics/Real-Time/Acquisition: no traffic-tracking tool
 * (GA/Plausible/PostHog/Vercel Analytics) or UTM capture exists in this
 * codebase today, so these pages have no real data source to render.
 * Showing this instead of a fabricated number is the whole point. */
export function OwnerEmptyState({
  title,
  reason,
  action,
}: {
  title: string;
  reason: string;
  /** Optional link/button rendered below the reason text — e.g. "Open the
   * Vercel dashboard" when the real data lives outside this console. */
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-white/15 bg-[#12151b] px-6 py-16 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-500/10 text-amber-400">
        <AlertTriangle className="h-5 w-5" strokeWidth={2} />
      </span>
      <p className="font-display text-base font-semibold text-white">{title}</p>
      <p className="max-w-md text-sm leading-relaxed text-slate-400">{reason}</p>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
