"use client";

import { useEffect, useRef, useState } from "react";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { Button, ButtonIcon } from "@/components/ui/button";
import { cn, formatEUR, formatSignedEUR } from "@/lib/utils";

const STAKE_MIN = 10;
const STAKE_MAX = 500;
const STAKE_STEP = 5;
const STAKE_DEFAULT = 50;
const STAKE_TICKS = ["10 €", "25 €", "50 €", "100 €", "250 €", "500 € et plus"];

const OPPORTUNITIES_MIN = 10;
const OPPORTUNITIES_MAX = 500;
const OPPORTUNITIES_STEP = 5;
const OPPORTUNITIES_DEFAULT = 80;
const OPPORTUNITIES_TICKS = ["10", "25", "50", "100", "200", "Plus de 500"];

function AmountSlider({
  label,
  value,
  onChange,
  min,
  max,
  step,
  ticks,
  valueLabel,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  ticks: string[];
  valueLabel: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-semibold text-ink sm:text-base">{label}</p>
        <span className="shrink-0 rounded-lg bg-brand-50 px-3 py-1 font-display text-base font-bold tabular-nums text-brand-600 sm:text-lg">
          {valueLabel}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={label}
        className="mt-4 h-2 w-full cursor-pointer accent-brand-500"
      />
      <div className="mt-2 flex justify-between text-[11px] font-medium text-body-soft sm:text-xs">
        {ticks.map((tick) => (
          <span key={tick}>{tick}</span>
        ))}
      </div>
    </div>
  );
}

export function PotentialCalculator() {
  const [stake, setStake] = useState(STAKE_DEFAULT);
  const [opportunities, setOpportunities] = useState(OPPORTUNITIES_DEFAULT);
  const potential = stake * opportunities;

  // Brief pulse on the result whenever it changes — the only "animation" on
  // the number itself, kept subtle (scale, not color/flash) per the "premium
  // but discreet" brief.
  const [pulsing, setPulsing] = useState(false);
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    setPulsing(true);
    const timeout = setTimeout(() => setPulsing(false), 220);
    return () => clearTimeout(timeout);
  }, [potential]);

  return (
    <section className="reveal py-10 sm:py-12">
      <Container className="flex flex-col gap-8">
        <SectionHeading
          eyebrow="Simulateur"
          title="Découvrez votre potentiel avec Polypips"
          description="Ajustez vos paramètres et visualisez votre potentiel mensuel."
        />

        <div className="mx-auto w-full max-w-2xl rounded-[28px] border border-border bg-surface p-6 shadow-[0_20px_50px_-28px_rgba(18,5,7,0.14)] sm:p-10">
          <div className="flex flex-col gap-8">
            <AmountSlider
              label="Mise moyenne par opportunité"
              value={stake}
              onChange={setStake}
              min={STAKE_MIN}
              max={STAKE_MAX}
              step={STAKE_STEP}
              ticks={STAKE_TICKS}
              valueLabel={formatEUR(stake)}
            />
            <AmountSlider
              label="Opportunités analysées par mois"
              value={opportunities}
              onChange={setOpportunities}
              min={OPPORTUNITIES_MIN}
              max={OPPORTUNITIES_MAX}
              step={OPPORTUNITIES_STEP}
              ticks={OPPORTUNITIES_TICKS}
              valueLabel={String(opportunities)}
            />
          </div>

          <div className="relative mt-9 overflow-hidden rounded-2xl border border-brand-100 bg-[linear-gradient(135deg,var(--color-brand-50)_0%,var(--color-surface)_65%)] px-6 py-8 text-center sm:px-10 sm:py-10">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-600">
              Votre potentiel mensuel
            </p>
            <p
              className={cn(
                "mt-3 font-display text-[40px] font-extrabold tabular-nums leading-none tracking-tight text-ink transition-transform duration-200 ease-[var(--ease-premium)] sm:text-[56px]",
                pulsing && "scale-105"
              )}
            >
              {formatSignedEUR(potential)}
            </p>
            <p className="mx-auto mt-4 max-w-sm text-xs leading-relaxed text-body-soft">
              Simulation indicative basée sur les paramètres sélectionnés. Les
              performances réelles peuvent varier.
            </p>
          </div>

          <Button
            href="/signup"
            size="lg"
            className="mt-6 w-full"
          >
            Bénéficiez de l&apos;avantage Polypips
            <ButtonIcon>→</ButtonIcon>
          </Button>
        </div>
      </Container>
    </section>
  );
}
