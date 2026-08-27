"use client";

import { useState } from "react";
import { TriangleAlert, X } from "lucide-react";

const CONFIRM_WORD = "SUPPRIMER";

export function DeleteAccountModal({
  open,
  onClose,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const [value, setValue] = useState("");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 animate-fade-in bg-dash-overlay"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative w-full max-w-md animate-fade-up rounded-2xl border border-rose-500/20 bg-dash-bg p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-rose-500/15 text-rose-400">
            <TriangleAlert className="h-5 w-5" />
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-dash-border text-dash-text-secondary transition-colors hover:text-dash-text"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <h2 className="mt-4 font-display text-lg font-bold text-dash-text">
          Supprimer définitivement votre compte ?
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-dash-text-secondary">
          Cette action est irréversible. Toutes vos analyses, positions
          suivies et préférences seront supprimées. Pour confirmer, tapez{" "}
          <span className="font-semibold text-dash-text">{CONFIRM_WORD}</span>{" "}
          ci-dessous.
        </p>

        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={CONFIRM_WORD}
          className="mt-4 w-full rounded-xl border border-dash-border bg-dash-surface px-4 py-2.5 text-sm text-dash-text placeholder:text-dash-text-faint focus:border-rose-400/50 focus:outline-none"
        />

        <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 items-center justify-center rounded-full border border-dash-border-strong text-sm font-semibold text-dash-text-secondary transition-colors hover:border-dash-text-quaternary hover:text-dash-text sm:flex-1"
          >
            Annuler
          </button>
          <button
            type="button"
            disabled={value.trim() !== CONFIRM_WORD}
            onClick={onConfirm}
            className="flex h-11 items-center justify-center rounded-full bg-rose-500 px-6 text-sm font-semibold text-white transition-transform duration-150 ease-out hover:scale-[1.02] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40 sm:flex-1"
          >
            Supprimer mon compte
          </button>
        </div>
      </div>
    </div>
  );
}
