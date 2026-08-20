"use client";

import { useTransition } from "react";
import { Pause, Play } from "lucide-react";

export function ToggleInfluencerStatusButton({
  status,
  action,
}: {
  status: "active" | "paused";
  action: () => Promise<void>;
}) {
  const [pending, startTransition] = useTransition();
  const isActive = status === "active";

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(action)}
      className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-semibold text-slate-200 transition-colors hover:bg-white/10 disabled:pointer-events-none disabled:opacity-50"
    >
      {isActive ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
      {isActive ? "Mettre en pause" : "Réactiver"}
    </button>
  );
}
