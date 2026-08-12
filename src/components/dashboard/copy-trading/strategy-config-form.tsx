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

export function StrategyConfigForm({
  strategy,
  onCancel,
  onActivate,
}: {
  strategy: Strategy;
  onCancel: () => void;
  onActivate: (params: RiskParameters) => void;
}) {
  const [maxPositionAmount, setMaxPositionAmount] = useState(
    strategy.defaultRiskParameters.maxPositionAmount
  );
  const [maxExposure, setMaxExposure] = useState(
    strategy.defaultRiskParameters.maxExposure
  );
  const [maxSimultaneousPositions, setMaxSimultaneousPositions] = useState(
    strategy.defaultRiskParameters.maxSimultaneousPositions
  );
  const [confirmed, setConfirmed] = useState(false);

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
          Définissez vos paramètres de risque avant d&apos;activer cette
          stratégie.
        </p>
      </div>

      <RiskDisclaimer />

      <div className="flex flex-col gap-5 rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
        <NumberField
          label="Montant maximum par position"
          value={maxPositionAmount}
          onChange={setMaxPositionAmount}
          min={50}
          max={5000}
          step={50}
          suffix="Montant maximum engagé sur chaque position copiée."
        />
        <SliderField
          label="Exposition maximale"
          value={maxExposure}
          onChange={setMaxExposure}
          min={5}
          max={100}
          unit="%"
        />
        <NumberField
          label="Nombre maximum de positions simultanées"
          value={maxSimultaneousPositions}
          onChange={setMaxSimultaneousPositions}
          min={1}
          max={20}
          step={1}
        />
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-white/40">
          Récapitulatif
        </p>
        <p className="mt-2 font-display text-lg font-bold text-white">
          {strategy.name}
        </p>
        <p className="mt-1 text-sm text-white/60">{strategy.description}</p>
        <div className="mt-4 grid grid-cols-3 gap-3 text-xs">
          <div>
            <p className="text-white/35">Montant max / position</p>
            <p className="mt-0.5 font-semibold text-white">
              {formatEUR(maxPositionAmount)}
            </p>
          </div>
          <div>
            <p className="text-white/35">Exposition max</p>
            <p className="mt-0.5 font-semibold text-white">{maxExposure}%</p>
          </div>
          <div>
            <p className="text-white/35">Positions simultanées</p>
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
          Je comprends les risques associés au copy trading.
        </span>
      </label>

      <Button
        type="button"
        disabled={!confirmed}
        onClick={() =>
          onActivate({
            maxPositionAmount,
            maxExposure,
            maxSimultaneousPositions,
          })
        }
        className="w-full sm:w-auto sm:self-end"
      >
        Activer cette stratégie
      </Button>
    </div>
  );
}
