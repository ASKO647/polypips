"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

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
        className="absolute inset-0 animate-fade-in bg-black/70"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative w-full max-w-md animate-fade-up rounded-2xl border border-white/10 bg-[#160b0c] p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <h2 className="font-display text-lg font-bold text-white">
            Annuler votre abonnement ?
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 text-white/60 transition-colors hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-white/60">
          Vous conserverez l&apos;accès à votre plan actuel jusqu&apos;à la
          fin de la période en cours{renewalDate ? ` (${renewalDate})` : ""},
          puis votre compte repassera en accès limité.
        </p>
        <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={confirming}
            className="sm:flex-1"
          >
            Retour
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={confirming}
            className="sm:flex-1"
          >
            {confirming ? "Annulation en cours..." : "Confirmer l'annulation"}
          </Button>
        </div>
      </div>
    </div>
  );
}
