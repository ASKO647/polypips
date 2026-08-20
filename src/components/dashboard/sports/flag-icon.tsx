import { Globe2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Small inline-SVG flags for the handful of countries this module
 * currently covers. Deliberately not emoji (flag emoji render as plain
 * two-letter codes on Windows without a flag-capable font, which is
 * exactly the "unreliable" rendering this replaces) and deliberately not
 * a remote flag-image API (one more external dependency that can go
 * down) — self-contained SVG renders identically everywhere.
 */
function FrFlag() {
  return (
    <svg viewBox="0 0 3 2" xmlns="http://www.w3.org/2000/svg">
      <rect width="1" height="2" fill="#0055A4" />
      <rect x="1" width="1" height="2" fill="#fff" />
      <rect x="2" width="1" height="2" fill="#EF4135" />
    </svg>
  );
}

function GbFlag() {
  // England (St George's Cross) — the competitions this covers (Premier
  // League, FA Cup, EFL Championship) are English, not UK-wide.
  return (
    <svg viewBox="0 0 60 36" xmlns="http://www.w3.org/2000/svg">
      <rect width="60" height="36" fill="#fff" />
      <rect x="24" width="12" height="36" fill="#CE1124" />
      <rect y="12" width="60" height="12" fill="#CE1124" />
    </svg>
  );
}

function EsFlag() {
  return (
    <svg viewBox="0 0 3 2" xmlns="http://www.w3.org/2000/svg">
      <rect width="3" height="2" fill="#AA151B" />
      <rect y="0.5" width="3" height="1" fill="#F1BF00" />
    </svg>
  );
}

function ItFlag() {
  return (
    <svg viewBox="0 0 3 2" xmlns="http://www.w3.org/2000/svg">
      <rect width="1" height="2" fill="#009246" />
      <rect x="1" width="1" height="2" fill="#fff" />
      <rect x="2" width="1" height="2" fill="#CE2B37" />
    </svg>
  );
}

function DeFlag() {
  return (
    <svg viewBox="0 0 3 2" xmlns="http://www.w3.org/2000/svg">
      <rect width="3" height="0.667" fill="#000" />
      <rect y="0.667" width="3" height="0.667" fill="#DD0000" />
      <rect y="1.333" width="3" height="0.667" fill="#FFCE00" />
    </svg>
  );
}

/** 12 points on a r=9 circle around (15, 10), precomputed rather than
 * derived from Math.cos/sin at render time — those can differ in their
 * last floating-point digit between the Node.js server renderer and the
 * browser, which was causing a React hydration mismatch on every page
 * that rendered this flag. */
const EU_STARS: [number, number][] = [
  [15, 1],
  [19.5, 2.206],
  [22.794, 5.5],
  [24, 10],
  [22.794, 14.5],
  [19.5, 17.794],
  [15, 19],
  [10.5, 17.794],
  [7.206, 14.5],
  [6, 10],
  [7.206, 5.5],
  [10.5, 2.206],
];

function EuFlag() {
  return (
    <svg viewBox="0 0 30 20" xmlns="http://www.w3.org/2000/svg">
      <rect width="30" height="20" fill="#003399" />
      {EU_STARS.map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="0.9" fill="#FFCC00" />
      ))}
    </svg>
  );
}

const FLAGS: Record<string, () => React.ReactElement> = {
  fr: FrFlag,
  gb: GbFlag,
  es: EsFlag,
  it: ItFlag,
  de: DeFlag,
  eu: EuFlag,
};

export function FlagIcon({ code, className }: { code: string | null | undefined; className?: string }) {
  const Flag = code ? FLAGS[code.toLowerCase()] : undefined;

  if (!Flag) {
    return (
      <span
        className={cn(
          "inline-flex shrink-0 items-center justify-center text-white/30",
          className
        )}
        aria-hidden
      >
        <Globe2 className="h-full w-full" strokeWidth={2} />
      </span>
    );
  }

  return (
    <span
      className={cn("inline-block shrink-0 overflow-hidden rounded-[2px]", className)}
      aria-hidden
    >
      <Flag />
    </span>
  );
}
