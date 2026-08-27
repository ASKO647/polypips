"use client";

import { X } from "lucide-react";

export function CancelSubscriptionModal({
  open,
  onClose,
  onConfirm,
  confirming = false,
  renewalDate,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  confirming?: boolean;
  renewalDate: string;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 animate-fade-in bg-dash-overlay"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative w-full max-w-md animate-fade-up rounded-2xl border border-dash-border bg-dash-bg p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <h2 className="font-display text-lg font-bold text-dash-text">
            Annuler votre abonnement ?
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-dash-border text-dash-text-secondary transition-colors hover:text-dash-text"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-dash-text-secondary">
          Votre accès sera coupé immédiatement, même s&apos;il vous reste du
          temps payé sur la période en cours
          {renewalDate ? ` (jusqu'au ${renewalDate})` : ""} — pas de
          remboursement, mais pas non plus d&apos;accès maintenu après
          l&apos;annulation.
        </p>
        <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
          <button
            type="button"
            onClick={onClose}
            disabled={confirming}
            className="flex h-11 items-center justify-center rounded-full border border-dash-border-strong text-sm font-semibold text-dash-text-secondary transition-colors hover:border-dash-text-quaternary hover:text-dash-text disabled:pointer-events-none disabled:opacity-50 sm:flex-1"
          >
            Retour
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={confirming}
            className="flex h-11 items-center justify-center rounded-full bg-brand-500 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:pointer-events-none disabled:opacity-60 sm:flex-1"
          >
            {confirming ? "Annulation en cours..." : "Confirmer l'annulation"}
          </button>
        </div>
      </div>
    </div>
  );
}
