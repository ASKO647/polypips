"use client";

import { useState } from "react";
import { Check, Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function FollowMatchButton({
  matchId,
  matchLabel,
  initialFollowed,
  className,
}: {
  matchId: string;
  matchLabel: string;
  initialFollowed: boolean;
  className?: string;
}) {
  const [followed, setFollowed] = useState(initialFollowed);
  const [pending, setPending] = useState(false);

  const toggle = async () => {
    if (pending) return;
    setPending(true);
    const next = !followed;
    setFollowed(next);
    try {
      const response = await fetch("/api/sports/follow-match", {
        method: next ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId, matchLabel }),
      });
      if (!response.ok) setFollowed(!next);
    } catch {
      setFollowed(!next);
    } finally {
      setPending(false);
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-semibold transition-colors duration-150 disabled:opacity-60",
        followed
          ? "border-brand-400 bg-brand-500/15 text-brand-400"
          : "border-white/15 bg-white/[0.03] text-white/60 hover:border-white/25 hover:text-white",
        className
      )}
    >
      {followed ? <Check className="h-3.5 w-3.5" /> : <Star className="h-3.5 w-3.5" />}
      {followed ? "Match suivi" : "Suivre ce match"}
    </button>
  );
}
