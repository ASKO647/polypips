"use client";

import { useState } from "react";
import { Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Competition } from "@/lib/sports/types";

/** Same pattern as TeamBadge: renders the real crest once
 * competition.logoUrl is populated, falls back to a generic trophy icon
 * (never a broken image) if there's no logo or the image fails to load. */
export function CompetitionBadge({
  competition,
  size = "md",
}: {
  competition: Competition;
  size?: "sm" | "md";
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const sizeClass = { sm: "h-5 w-5", md: "h-8 w-8" }[size];
  const iconSizeClass = { sm: "h-3 w-3", md: "h-4 w-4" }[size];

  if (competition.logoUrl && !imageFailed) {
    return (
      <span
        className={cn(
          "flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/[0.06]",
          sizeClass
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- external
            crest URL from API-Sports, unknown host set at build time. */}
        <img
          src={competition.logoUrl}
          alt={competition.name}
          className="h-full w-full object-contain"
          onError={() => setImageFailed(true)}
        />
      </span>
    );
  }

  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-white/40",
        sizeClass
      )}
      aria-hidden
    >
      <Trophy className={iconSizeClass} strokeWidth={2} />
    </span>
  );
}
