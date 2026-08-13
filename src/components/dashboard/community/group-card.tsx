"use client";

import { useState } from "react";
import { Lock, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { initialsFor } from "@/lib/data/community";
import type { GroupSummary } from "@/lib/data/community";
import { createClient } from "@/lib/supabase/client";
import { GroupActionError, joinGroup } from "@/lib/supabase/groups-client";
import { cn } from "@/lib/utils";

export function GroupCard({
  group,
  onOpen,
  onJoined,
}: {
  group: GroupSummary;
  onOpen: () => void;
  onJoined: () => void;
}) {
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleJoin = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (joining) return;
    setJoining(true);
    setError(null);
    try {
      const supabase = createClient();
      await joinGroup(supabase, group.id);
      onJoined();
    } catch (err) {
      setError(err instanceof GroupActionError ? err.message : "Une erreur est survenue.");
    } finally {
      setJoining(false);
    }
  };

  const joinLabel =
    group.membershipStatus === "approved"
      ? "Rejoint"
      : group.membershipStatus === "pending"
        ? "Demande envoyée"
        : group.membershipStatus === "rejected"
          ? "Redemander"
          : group.isPrivate
            ? "Demander à rejoindre"
            : "Rejoindre";

  const alreadyIn = group.membershipStatus === "approved" || group.membershipStatus === "pending";

  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-left transition-colors duration-150 hover:border-white/20"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-500/15 text-sm font-bold text-brand-400">
            {initialsFor(group.name)}
          </span>
          <div className="min-w-0">
            <p className="truncate font-display text-sm font-bold text-white">
              {group.name}
            </p>
            <p className="flex items-center gap-1 text-xs text-white/40">
              <Users className="h-3 w-3" strokeWidth={2.25} />
              {group.memberCount} membre{group.memberCount > 1 ? "s" : ""}
            </p>
          </div>
        </div>
        {group.isPrivate && (
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/[0.05] text-white/40">
            <Lock className="h-3.5 w-3.5" strokeWidth={2.25} />
          </span>
        )}
      </div>

      <p className="line-clamp-2 min-h-[2.5rem] text-sm leading-relaxed text-white/55">
        {group.description || "Pas de description."}
      </p>

      {error && <p className="text-xs text-rose-400">{error}</p>}

      <Button
        type="button"
        size="sm"
        variant={alreadyIn ? "outline" : "primary"}
        disabled={joining || alreadyIn}
        onClick={alreadyIn ? undefined : handleJoin}
        className={cn("w-full", alreadyIn && "pointer-events-none opacity-70")}
      >
        {joining ? "Envoi..." : joinLabel}
      </Button>
    </button>
  );
}
