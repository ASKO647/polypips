"use client";

import { useState } from "react";
import { Check, Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function FollowTeamButton({
  teamId,
  teamName,
  initialFollowed,
  size = "md",
  className,
}: {
  teamId: string;
  teamName: string;
  initialFollowed: boolean;
  size?: "sm" | "md";
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
      const response = await fetch("/api/sports/follow-team", {
        method: next ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId, teamName }),
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
      aria-label={followed ? `Ne plus suivre ${teamName}` : `Suivre ${teamName}`}
      className={cn(
        "inline-flex items-center justify-center rounded-full border transition-colors duration-150 disabled:opacity-60",
        size === "sm" ? "h-7 w-7" : "h-9 w-9",
        followed
          ? "border-brand-400 bg-brand-500/15 text-brand-400"
          : "border-white/15 bg-white/[0.03] text-white/50 hover:border-white/25 hover:text-white",
        className
      )}
    >
      {followed ? <Check className="h-3.5 w-3.5" /> : <Star className="h-3.5 w-3.5" />}
    </button>
  );
}
