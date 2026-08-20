import type { DailyVisits } from "@/lib/vercel/analytics";

const DATE_LABEL = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit" });

/** Plain SVG bar chart, no external charting library — matches the rest
 * of the app's hand-rolled SVG charts (see WalletChart). */
export function VercelPageviewsChart({ data }: { data: DailyVisits[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-2xl border border-white/10 bg-[#12151b] text-sm text-slate-500">
        Aucune donnée sur cette période.
      </div>
    );
  }

  const width = 100;
  const height = 40;
  const max = Math.max(...data.map((d) => d.pageviews), 1);
  const barWidth = width / data.length;
  const gap = barWidth * 0.2;

  return (
    <div className="rounded-2xl border border-white/10 bg-[#12151b] p-5">
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="h-40 w-full" aria-hidden>
        {data.map((d, i) => {
          const barHeight = (d.pageviews / max) * height;
          return (
            <rect
              key={d.date}
              x={i * barWidth + gap / 2}
              y={height - barHeight}
              width={barWidth - gap}
              height={barHeight}
              fill="currentColor"
              className="text-cyan-500/70"
              rx={0.6}
            />
          );
        })}
      </svg>
      {/* Only the range's start/end are labeled — evenly distributing an
       * arbitrary number of intermediate labels under their exact bar
       * would need per-label absolute positioning; two anchored labels
       * avoid that complexity entirely while still orienting the reader. */}
      <div className="mt-2 flex justify-between text-[10px] text-slate-500">
        <span>{DATE_LABEL.format(new Date(data[0]!.date))}</span>
        <span>{DATE_LABEL.format(new Date(data[data.length - 1]!.date))}</span>
      </div>
    </div>
  );
}
