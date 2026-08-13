"use client";

import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RiskDisclaimer } from "@/components/dashboard/copy-trading/risk-disclaimer";
import type { RiskParameters, Strategy } from "@/lib/data/copy-trading";
import { formatEUR } from "@/lib/utils";

function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  suffix,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
}) {
  const clamp = (v: number) => Math.min(max, Math.max(min, v));
  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-wide text-white/40">
        {label}
      </label>
      <div className="mt-2 flex items-center gap-2">
        <button
          type="button"
          aria-label="Diminuer"
          onClick={() => onChange(clamp(value - step))}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-lg font-semibold text-white/70 transition-colors hover:text-white"
        >
          −
        </button>
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(e) => {
            const parsed = Number(e.target.value);
            if (!Number.isNaN(parsed)) onChange(clamp(parsed));
          }}
          className="w-full rounded-xl border border-white/10 bg-white/[0.02] px-4 py-2.5 text-center text-sm font-semibold text-white focus:border-white/25 focus:outline-none"
        />
        <button
          type="button"
          aria-label="Augmenter"
          onClick={() => onChange(clamp(value + step))}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-lg font-semibold text-white/70 transition-colors hover:text-white"
        >
          +
        </button>
      </div>
      {suffix && <p className="mt-1.5 text-xs text-white/35">{suffix}</p>}
    </div>
  );
}

function SliderField({
  label,
  value,
  onChange,
  min,
  max,
  unit,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  unit: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <label className="font-semibold uppercase tracking-wide text-white/40">
          {label}
        </label>
        <span className="font-bold text-white">
          {value}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-3 h-2 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-brand-500"
      />
    </div>
  );
}

const DEFAULT_RISK_PARAMETERS: RiskParameters = {
  maxPositionAmount: 500,
  maxExposure: 20,
  maxSimultaneousPositions: 5,
};

export function StrategyConfigForm({
  strategy,
  onCancel,
  onActivate,
}: {
  strategy: Strategy;
  onCancel: () => void;
  onActivate: (params: RiskParameters) => Promise<void>;
}) {
  const initial = strategy.riskParameters ?? DEFAULT_RISK_PARAMETERS;
  const [maxPositionAmount, setMaxPositionAmount] = useState(initial.maxPositionAmount);
  const [maxExposure, setMaxExposure] = useState(initial.maxExposure);
  const [maxSimultaneousPositions, setMaxSimultaneousPositions] = useState(
    initial.maxSimultaneousPositions
  );
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await onActivate({ maxPositionAmount, maxExposure, maxSimultaneousPositions });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/50 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Annuler
        </button>
        <h1 className="mt-3 font-display text-xl font-bold text-white sm:text-2xl">
          Configurer la stratégie
        </h1>
        <p className="mt-1 text-sm text-white/50">
          Définissez les paramètres de risque qui déclenchent une
          notification pour {strategy.walletLabel}.
        </p>
      </div>

      <RiskDisclaimer />

      <div className="flex flex-col gap-5 rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
        <NumberField
          label="Montant maximum par mouvement"
          value={maxPositionAmount}
          onChange={setMaxPositionAmount}
          min={50}
          max={5000}
          step={50}
          suffix="Vous ne serez alerté que pour les mouvements de ce portefeuille inférieurs ou égaux à ce montant."
        />
        <SliderField
          label="Exposition maximale du portefeuille suivi"
          value={maxExposure}
          onChange={setMaxExposure}
          min={5}
          max={100}
          unit="%"
        />
        <NumberField
          label="Nombre maximum de suggestions actives"
          value={maxSimultaneousPositions}
          onChange={setMaxSimultaneousPositions}
          min={1}
          max={20}
          step={1}
          suffix="Au-delà, plus aucune nouvelle suggestion n'est générée pour cette stratégie tant que les précédentes datent de plus de 14 jours."
        />
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-white/40">
          Récapitulatif
        </p>
        <p className="mt-2 font-display text-lg font-bold text-white">
          {strategy.walletLabel}
        </p>
        <p className="mt-1 text-sm text-white/60">{strategy.walletAddress}</p>
        <div className="mt-4 grid grid-cols-3 gap-3 text-xs">
          <div>
            <p className="text-white/35">Montant max</p>
            <p className="mt-0.5 font-semibold text-white">
              {formatEUR(maxPositionAmount)}
            </p>
          </div>
          <div>
            <p className="text-white/35">Exposition max</p>
            <p className="mt-0.5 font-semibold text-white">{maxExposure}%</p>
          </div>
          <div>
            <p className="text-white/35">Suggestions actives max</p>
            <p className="mt-0.5 font-semibold text-white">
              {maxSimultaneousPositions}
            </p>
          </div>
        </div>
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-4">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 accent-brand-500"
        />
        <span className="text-sm text-white/70">
          Je comprends que Polypips ne fait qu&apos;envoyer une notification —
          aucun ordre n&apos;est jamais exécuté à ma place.
        </span>
      </label>

      {error && <p className="text-xs text-rose-400">{error}</p>}

      <Button
        type="button"
        disabled={!confirmed || submitting}
        onClick={handleSubmit}
        className="w-full sm:w-auto sm:self-end"
      >
        {submitting ? "Activation..." : "Activer cette stratégie"}
      </Button>
    </div>
  );
}
