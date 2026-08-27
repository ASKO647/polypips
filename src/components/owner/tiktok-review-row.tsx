"use client";

import { useState, useTransition } from "react";
import { Check, X } from "lucide-react";

export function TiktokReviewRow({
  submissionId,
  onApprove,
  onReject,
}: {
  submissionId: string;
  onApprove: (submissionId: string, verifiedViews: number) => Promise<{ error: string | null }>;
  onReject: (submissionId: string, reason: string) => Promise<{ error: string | null }>;
}) {
  const [views, setViews] = useState("");
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const handleApprove = () => {
    setError(null);
    const parsed = Number(views);
    startTransition(async () => {
      const result = await onApprove(submissionId, parsed);
      if (result.error) setError(result.error);
    });
  };

  const handleReject = () => {
    setError(null);
    startTransition(async () => {
      const result = await onReject(submissionId, reason);
      if (result.error) {
        setError(result.error);
      } else {
        setRejecting(false);
        setReason("");
      }
    });
  };

  if (rejecting) {
    return (
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Motif du refus"
            className="w-full max-w-[200px] rounded-lg border border-white/10 bg-[#0d1015] px-2.5 py-1.5 text-xs text-white placeholder:text-slate-500 focus:border-white/25 focus:outline-none"
          />
          <button
            type="button"
            disabled={pending}
            onClick={handleReject}
            className="shrink-0 rounded-lg bg-rose-500/15 px-2.5 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/25 disabled:pointer-events-none disabled:opacity-50"
          >
            Confirmer
          </button>
          <button
            type="button"
            onClick={() => {
              setRejecting(false);
              setError(null);
            }}
            className="shrink-0 text-xs font-semibold text-slate-400 hover:text-white"
          >
            Annuler
          </button>
        </div>
        {error && <p className="text-xs text-rose-400">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={0}
          value={views}
          onChange={(e) => setViews(e.target.value)}
          placeholder="Vues"
          className="w-20 rounded-lg border border-white/10 bg-[#0d1015] px-2.5 py-1.5 text-xs text-white placeholder:text-slate-500 focus:border-white/25 focus:outline-none"
        />
        <button
          type="button"
          disabled={pending || !views}
          onClick={handleApprove}
          className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-emerald-500/15 px-2.5 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/25 disabled:pointer-events-none disabled:opacity-50"
        >
          <Check className="h-3 w-3" /> Approuver
        </button>
        <button
          type="button"
          onClick={() => setRejecting(true)}
          className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/10"
        >
          <X className="h-3 w-3" /> Refuser
        </button>
      </div>
      {error && <p className="text-xs text-rose-400">{error}</p>}
    </div>
  );
}
