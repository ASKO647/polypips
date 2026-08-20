import { cn } from "@/lib/utils";
import type { Team } from "@/lib/sports/types";

/** Circular initials badge — no team crest image pipeline exists yet, so
 * this stands in for a logo everywhere a match references a team. */
export function TeamBadge({ team, size = "md" }: { team: Team; size?: "sm" | "md" | "lg" }) {
  const sizeClass = {
    sm: "h-8 w-8 text-[11px]",
    md: "h-12 w-12 text-sm",
    lg: "h-16 w-16 text-base",
  }[size];

  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full border-2 bg-white/[0.06] font-display font-bold text-white",
        sizeClass
      )}
      style={{ borderColor: team.accentColor ?? "var(--color-brand-500)" }}
      aria-hidden
    >
      {team.initials}
    </span>
  );
}
