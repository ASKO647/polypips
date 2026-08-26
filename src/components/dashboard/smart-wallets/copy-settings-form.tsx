"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DEFAULT_SIGNAL_COPY_SETTINGS, type SignalCopySettings } from "@/lib/data/signal-copy-trading";

type FormState = Omit<SignalCopySettings, "id" | "walletId" | "enabled">;

/** The Risk Engine (sync-signal-wallets) reads exactly these fields on
 * every fresh trade to decide whether it generates a "copié" notification
 * — see that function's risk-engine.ts. Every limit set here is always
 * enforced, independent of the AI Engine's own score. Nothing here ever
 * sizes or places an order: Copy Trading means watch + notify, exactly
 * like Polymarket's own Copy Trading. */
export function CopySettingsForm({
  walletId,
  initial,
  onSaved,
}: {
  walletId: string;
  initial: SignalCopySettings;
  onSaved: (settings: SignalCopySettings) => void;
}) {
  const [form, setForm] = useState<FormState>({
    maxPositionAmount: initial.maxPositionAmount,
    positionPercent: initial.positionPercent,
    maxDailyAmount: initial.maxDailyAmount,
    maxSimultaneousPositions: initial.maxSimultaneousPositions,
    maxSlippagePercent: initial.maxSlippagePercent,
    excludedTokens: initial.excludedTokens,
  });
  const [excludedInput, setExcludedInput] = useState(initial.excludedTokens.join(", "));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setNumber = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: Number(e.target.value) }));

  const save = async (enabled: boolean) => {
    setSaving(true);
    setError(null);
    const excludedTokens = excludedInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      const response = await fetch("/api/signal-wallets/copy-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletId, enabled, ...form, excludedTokens }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Une erreur est survenue.");
      onSaved({ id: initial.id, walletId, enabled, ...form, excludedTokens });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-3.5 rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-[11px] font-semibold text-white/50">
          Montant maximum par trade ($)
          <input
            type="number"
            min={1}
            value={form.maxPositionAmount}
            onChange={setNumber("maxPositionAmount")}
            className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-white outline-none focus:border-brand-400"
          />
        </label>
        <label className="flex flex-col gap-1 text-[11px] font-semibold text-white/50">
          % de la position à copier
          <input
            type="number"
            min={0.1}
            max={100}
            step={0.1}
            value={form.positionPercent}
            onChange={setNumber("positionPercent")}
            className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-white outline-none focus:border-brand-400"
          />
        </label>
        <label className="flex flex-col gap-1 text-[11px] font-semibold text-white/50">
          Montant maximum par jour ($)
          <input
            type="number"
            min={1}
            value={form.maxDailyAmount}
            onChange={setNumber("maxDailyAmount")}
            className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-white outline-none focus:border-brand-400"
          />
        </label>
        <label className="flex flex-col gap-1 text-[11px] font-semibold text-white/50">
          Positions simultanées maximum
          <input
            type="number"
            min={1}
            value={form.maxSimultaneousPositions}
            onChange={setNumber("maxSimultaneousPositions")}
            className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-white outline-none focus:border-brand-400"
          />
        </label>
        <label className="flex flex-col gap-1 text-[11px] font-semibold text-white/50">
          Slippage maximum (%)
          <input
            type="number"
            min={0.1}
            max={100}
            step={0.1}
            value={form.maxSlippagePercent}
            onChange={setNumber("maxSlippagePercent")}
            className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-white outline-none focus:border-brand-400"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1 text-[11px] font-semibold text-white/50">
        Tokens à exclure (séparés par des virgules)
        <input
          type="text"
          value={excludedInput}
          onChange={(e) => setExcludedInput(e.target.value)}
          placeholder="$SCAM, $RUG"
          className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-white placeholder:text-white/25 outline-none focus:border-brand-400"
        />
      </label>

      {error && <p className="text-xs text-rose-300">{error}</p>}

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button type="button" onClick={() => save(true)} disabled={saving} className="flex-1">
          {initial.enabled ? "Mettre à jour" : "Activer le Copy Trading"}
        </Button>
        {initial.enabled && (
          <Button type="button" variant="outline" onClick={() => save(false)} disabled={saving} className="flex-1">
            Désactiver le Copy Trading
          </Button>
        )}
      </div>
    </div>
  );
}

export { DEFAULT_SIGNAL_COPY_SETTINGS };
