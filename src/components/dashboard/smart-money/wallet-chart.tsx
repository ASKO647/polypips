import { useId } from "react";
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
}) {
  const gradientId = useId();
  const width = 100;
  const height = 40;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const stepX = width / (points.length - 1);

  const coords = points.map((value, i) => {
    const x = i * stepX;
    const y = height - ((value - min) / range) * height;
    return `${x},${y}`;
  });

  const linePath = coords
    .map((coord, i) => `${i === 0 ? "M" : "L"}${coord}`)
    .join(" ");
  const areaPath = `${linePath} L${width},${height} L0,${height} Z`;

  return (
    <div
      className={cn(
        "h-full w-full",
        tone ? TONE_CLASSES[tone] : positive ? "text-emerald-400" : "text-rose-400",
        className
      )}
    >
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="h-full w-full"
        aria-hidden
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
      </svg>
    </div>
  );
}
