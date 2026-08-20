"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { Team } from "@/lib/sports/types";

/** Renders the real crest once team.logoUrl is populated (only happens
 * once a genuine sports-data API is connected — see Team.logoUrl's own
 * comment). Until then, and if the image ever fails to load, falls back
 * to the initials/color-ring badge that stands in for a logo everywhere a
 * match references a team today. */
export function TeamBadge({ team, size = "md" }: { team: Team; size?: "sm" | "md" | "lg" }) {
  const [imageFailed, setImageFailed] = useState(false);
  const sizeClass = {
    sm: "h-8 w-8 text-[11px]",
    md: "h-12 w-12 text-sm",
    lg: "h-16 w-16 text-base",
  }[size];

  if (team.logoUrl && !imageFailed) {
    return (
      <span
        className={cn(
          "flex shrink-0 items-center justify-center overflow-hidden rounded-full border-2 bg-white/[0.06]",
          sizeClass
        )}
        style={{ borderColor: team.accentColor ?? "var(--color-brand-500)" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- external
            crest URL from a not-yet-connected sports API, unknown host at
            build time; next/image would require configuring remote
            patterns for a domain we don't have yet. */}
        <img
          src={team.logoUrl}
          alt={team.name}
          className="h-full w-full object-cover"
          onError={() => setImageFailed(true)}
        />
      </span>
    );
  }

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
