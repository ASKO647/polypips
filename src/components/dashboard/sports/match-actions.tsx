"use client";

import { useState } from "react";
import { Bell, BellRing, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * "Ajouter aux favoris" / "Suivre ce match" — local-state only for now.
 * There's no sports_match_follows-style table yet (the equivalent of
 * user_wallet_follows for Smart Money), so nothing persists across a
 * reload yet. Wiring real persistence is a follow-up in the same shape
 * as the wallet-follow API route — this component's onToggle* props are
 * already split out so that swap only touches this file, not callers.
 */
export function MatchActions() {
  const [favorited, setFavorited] = useState(false);
  const [following, setFollowing] = useState(false);

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => setFavorited((v) => !v)}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-colors duration-150",
          favorited
            ? "border-brand-400/50 bg-brand-500/15 text-brand-400"
            : "border-white/10 bg-white/[0.04] text-white/60 hover:border-white/20 hover:text-white"
        )}
      >
        <Heart className={cn("h-3.5 w-3.5", favorited && "fill-current")} strokeWidth={2} />
        {favorited ? "Dans les favoris" : "Ajouter aux favoris"}
      </button>
      <button
        type="button"
        onClick={() => setFollowing((v) => !v)}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-colors duration-150",
          following
            ? "border-brand-400/50 bg-brand-500/15 text-brand-400"
            : "border-white/10 bg-white/[0.04] text-white/60 hover:border-white/20 hover:text-white"
        )}
      >
        {following ? (
          <BellRing className="h-3.5 w-3.5" strokeWidth={2} />
        ) : (
          <Bell className="h-3.5 w-3.5" strokeWidth={2} />
        )}
        {following ? "Suivi activé" : "Suivre ce match"}
      </button>
    </div>
  );
}
