"use client";

import { useState } from "react";
import { Bell, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { createAlert } from "@/lib/supabase/pips-tracks";

function CreateAlertModal({ onClose }: { onClose: () => void }) {
  const [tokenSymbol, setTokenSymbol] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const supabase = createClient();
      await createAlert(supabase, {
        tokenSymbol: tokenSymbol.trim() ? tokenSymbol.trim().toUpperCase() : null,
        minAmountUsd: minAmount.trim() ? Number(minAmount) : null,
      });
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Alerte non enregistrée.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#0f0808] p-6 shadow-[0_20px_60px_-16px_rgba(0,0,0,0.6)]">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-display text-base font-bold text-white">Créer une alerte</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="rounded-full p-1 text-white/40 transition-colors hover:bg-white/5 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {saved ? (
          <div className="mt-5 flex flex-col gap-2">
            <p className="text-sm text-emerald-400">Alerte enregistrée.</p>
            <p className="text-xs leading-relaxed text-white/40">
              La détection automatique et l&apos;envoi de notification pour cette alerte arrivent dans une
              prochaine mise à jour — votre préférence est déjà sauvegardée.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-medium text-white/40">Token (optionnel)</label>
              <input
                type="text"
                value={tokenSymbol}
                onChange={(e) => setTokenSymbol(e.target.value)}
                placeholder="Ex : PEPE"
                className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-white/25 focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-medium text-white/40">Montant minimum (optionnel)</label>
              <input
                type="number"
                min={0}
                value={minAmount}
                onChange={(e) => setMinAmount(e.target.value)}
                placeholder="Ex : 10000"
                className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-white/25 focus:outline-none"
              />
            </div>
            {error && <p className="text-xs font-medium text-rose-400">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="flex h-10 w-full items-center justify-center rounded-full bg-brand-500 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:pointer-events-none disabled:opacity-40"
            >
              {submitting ? "Enregistrement..." : "Créer l'alerte"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export function AlertsPanel() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <h2 className="text-sm font-bold text-white">Alertes personnalisées</h2>
      <p className="text-xs leading-relaxed text-white/50">
        Recevez une notification pour les événements importants.
      </p>
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className="flex h-10 w-full items-center justify-center gap-2 rounded-full bg-rose-500 text-sm font-semibold text-white transition-colors hover:bg-rose-600"
      >
        <Bell className="h-4 w-4" strokeWidth={2} />
        Créer une alerte
      </button>

      {modalOpen && <CreateAlertModal onClose={() => setModalOpen(false)} />}
    </div>
  );
}
