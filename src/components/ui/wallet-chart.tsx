"use client";

import { useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const TONE_CLASSES = {
  brand: "text-brand-400",
  emerald: "text-emerald-400",
  amber: "text-amber-400",
  neutral: "text-white/30",
} as const;

export function WalletChart({
  points,
  positive,
  tone,
  className,
  labels,
  valueFormatter,
  interactive = false,
}: {
  points: number[];
  /** Ignored when `tone` is set — kept as the default emerald/rose
   * gain-or-loss coloring for existing callers (wallet value evolution). */
  positive: boolean;
  /** Overrides `positive`-based coloring for sparklines that represent an
   * activity count rather than a gain/loss (e.g. dashboard quick-access
   * cards), where "up" isn't inherently good or bad. */
  tone?: keyof typeof TONE_CLASSES;
  className?: string;
  /** One label per point (e.g. a formatted date) — shown in the hover
   * tooltip alongside its value. Only used when `interactive` is true;
   * falls back to the point's index when omitted. */
  labels?: string[];
  /** Formats a point's raw value for the tooltip — defaults to the plain
   * number. Only used when `interactive` is true. */
  valueFormatter?: (value: number) => string;
  /** Opt-in hover cursor + tooltip (a vertical guide line, a dot on the
   * nearest point, and a small label/value readout) — every existing
   * sparkline usage (dashboard quick-access cards, stats evolution chart)
   * stays the plain non-interactive rendering unless this is set. Added
   * for Copy Trading's on-demand wallet lookup, whose day-by-day
   * gains/losses chart needs to be readable per-day, not just as a shape. */
  interactive?: boolean;
}) {
  const gradientId = useId();
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const width = 100;
  const height = 40;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const stepX = width / (points.length - 1 || 1);

  const coords = points.map((value, i) => {
    const x = i * stepX;
    const y = height - ((value - min) / range) * height;
    return { x, y };
  });

  const linePath = coords
    .map((c, i) => `${i === 0 ? "M" : "L"}${c.x},${c.y}`)
    .join(" ");
  const areaPath = `${linePath} L${width},${height} L0,${height} Z`;

  const updateHover = (clientX: number) => {
    const svg = svgRef.current;
    if (!svg || points.length === 0) return;
    const rect = svg.getBoundingClientRect();
    const ratio = rect.width === 0 ? 0 : (clientX - rect.left) / rect.width;
    const index = Math.round(ratio * (points.length - 1));
    setHoverIndex(Math.min(points.length - 1, Math.max(0, index)));
  };

  const hovered = hoverIndex !== null ? coords[hoverIndex] : null;
  const colorClass = tone ? TONE_CLASSES[tone] : positive ? "text-emerald-400" : "text-rose-400";

  return (
    <div className={cn("relative h-full w-full", colorClass, className)}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className={cn("h-full w-full", interactive && "cursor-crosshair")}
        aria-hidden
        onMouseMove={interactive ? (e) => updateHover(e.clientX) : undefined}
        onMouseLeave={interactive ? () => setHoverIndex(null) : undefined}
        onTouchMove={
          interactive
            ? (e) => {
                const touch = e.touches[0];
                if (touch) updateHover(touch.clientX);
              }
            : undefined
        }
        onTouchEnd={interactive ? () => setHoverIndex(null) : undefined}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.35" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill={`url(#${gradientId})`} stroke="none" />
        <path
          d={linePath}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        {hovered && (
          <>
            <line
              x1={hovered.x}
              y1="0"
              x2={hovered.x}
              y2={height}
              stroke="currentColor"
              strokeOpacity="0.35"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
            <circle
              cx={hovered.x}
              cy={hovered.y}
              r="2.5"
              fill="currentColor"
              stroke="white"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
          </>
        )}
      </svg>

      {interactive && hoverIndex !== null && (
        <div
          className="pointer-events-none absolute top-0 z-10 -translate-y-full rounded-lg border border-white/10 bg-[#0B0B0E] px-2.5 py-1.5 text-[11px] font-semibold whitespace-nowrap text-white shadow-lg"
          style={{
            left: `${(hoverIndex / Math.max(1, points.length - 1)) * 100}%`,
            transform: "translate(-50%, -8px)",
          }}
        >
          <p className="text-white/50">{labels?.[hoverIndex] ?? `#${hoverIndex + 1}`}</p>
          <p>
            {valueFormatter
              ? valueFormatter(points[hoverIndex])
              : points[hoverIndex].toLocaleString("fr-FR")}
          </p>
        </div>
      )}
    </div>
  );
}
