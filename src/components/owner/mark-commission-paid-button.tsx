"use client";

import { useTransition } from "react";
import { Check } from "lucide-react";

export function MarkCommissionPaidButton({
  action,
}: {
  action: () => Promise<void>;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(action)}
      className="inline-flex items-center gap-1 rounded-lg bg-white/10 px-2.5 py-1 text-xs font-semibold text-slate-200 transition-colors hover:bg-white/15 disabled:pointer-events-none disabled:opacity-50"
    >
      <Check className="h-3 w-3" /> Marquer payée
    </button>
  );
}
