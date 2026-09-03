"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { Button, ButtonIcon } from "@/components/ui/button";
import { cn, formatEUR, formatSignedEUR } from "@/lib/utils";

/**
 * The tick labels under each slider ("10 € — 25 € — 50 € — 100 € — 250 € —
 * 500 €") are rendered evenly spaced (`justify-between`), but those values
 * themselves are NOT evenly spaced numerically (25→50 is a 25-wide gap,
 * 250→500 is a 250-wide gap). A plain linear `<input type="range" min max>`
 * has no notion of that — it places the thumb at (value-min)/(max-min), so
 * the default value 50 landed near the far-left edge instead of under its
 * own "50 €" label. RESOLUTION_PER_SEGMENT below builds a lookup table that
 * treats each tick-to-tick gap as an equal-width segment of the track
 * (matching the visual `justify-between` layout exactly), so the native
 * range input's index-based value always lines up with the label it's
 * nearest to, at every position along the track — not just at the default.
 */
const RESOLUTION_PER_SEGMENT = 20;

function buildScale(tickValues: number[], roundTo: number): number[] {
  const segments = tickValues.length - 1;
  const scale: number[] = [];
  for (let i = 0; i < segments; i++) {
    const start = tickValues[i];
    const end = tickValues[i + 1];
    for (let s = 0; s < RESOLUTION_PER_SEGMENT; s++) {
      const fraction = s / RESOLUTION_PER_SEGMENT;
      const raw = start + fraction * (end - start);
      scale.push(Math.round(raw / roundTo) * roundTo);
    }
  }
  scale.push(tickValues[segments]);
  // Rounding each point independently can't actually produce a decrease
  // given tickValues is itself non-decreasing, but guard it explicitly
  // anyway so the slider can never visually move backwards as it's dragged
  // forward.
  for (let i = 1; i < scale.length; i++) {
    if (scale[i] < scale[i - 1]) scale[i] = scale[i - 1];
  }
  return scale;
}

/**
 * Analytically inverts buildScale's segment/fraction math for a known
 * target value, instead of scanning the (rounded) scale array for the
 * first entry that happens to display the same number — scanning can land
 * a few indices before the value's true position, since RESOLUTION_PER_SEGMENT
 * combined with rounding to the nearest STAKE_ROUND_TO/OPPORTUNITIES_ROUND_TO
 * means several consecutive raw positions can round to an identical
 * displayed number. This is what makes the default values line up exactly
 * under their tick label instead of merely "close enough".
 */
function indexForValue(tickValues: number[], value: number): number {
  const segments = tickValues.length - 1;
  for (let i = 0; i < segments; i++) {
    const start = tickValues[i];
    const end = tickValues[i + 1];
    if (value <= end || i === segments - 1) {
      const fraction = (value - start) / (end - start);
      return Math.round((i + fraction) * RESOLUTION_PER_SEGMENT);
    }
  }
  return segments * RESOLUTION_PER_SEGMENT;
}

const STAKE_TICK_VALUES = [10, 25, 50, 100, 250, 500];
const STAKE_ROUND_TO = 5;
const STAKE_DEFAULT = 50;

const OPPORTUNITIES_TICK_VALUES = [10, 25, 50, 100, 200, 500];
const OPPORTUNITIES_ROUND_TO = 5;
const OPPORTUNITIES_DEFAULT = 80;

function AmountSlider({
  label,
  scale,
  index,
  onIndexChange,
  ticks,
  valueLabel,
}: {
  label: string;
  scale: number[];
  index: number;
  onIndexChange: (index: number) => void;
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
        min={0}
        max={scale.length - 1}
        step={1}
        value={index}
        onChange={(e) => onIndexChange(Number(e.target.value))}
        aria-label={label}
        aria-valuetext={valueLabel}
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
  const t = useTranslations("Calculator");
  const stakeTickLabels = t.raw("stakeTicks") as string[];
  const opportunitiesTickLabels = t.raw("opportunitiesTicks") as string[];

  const stakeScale = useMemo(
    () => buildScale(STAKE_TICK_VALUES, STAKE_ROUND_TO),
    []
  );
  const opportunitiesScale = useMemo(
    () => buildScale(OPPORTUNITIES_TICK_VALUES, OPPORTUNITIES_ROUND_TO),
    []
  );

  const [stakeIndex, setStakeIndex] = useState(() =>
    indexForValue(STAKE_TICK_VALUES, STAKE_DEFAULT)
  );
  const [opportunitiesIndex, setOpportunitiesIndex] = useState(() =>
    indexForValue(OPPORTUNITIES_TICK_VALUES, OPPORTUNITIES_DEFAULT)
  );

  const stake = stakeScale[stakeIndex];
  const opportunities = opportunitiesScale[opportunitiesIndex];
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
          eyebrow={t("eyebrow")}
          title={t("title")}
          description={t("description")}
        />

        <div className="mx-auto w-full max-w-2xl rounded-[28px] border border-border bg-surface p-6 shadow-[0_20px_50px_-28px_rgba(18,5,7,0.14)] sm:p-10">
          <div className="flex flex-col gap-8">
            <AmountSlider
              label={t("stakeLabel")}
              scale={stakeScale}
              index={stakeIndex}
              onIndexChange={setStakeIndex}
              ticks={stakeTickLabels}
              valueLabel={formatEUR(stake)}
            />
            <AmountSlider
              label={t("opportunitiesLabel")}
              scale={opportunitiesScale}
              index={opportunitiesIndex}
              onIndexChange={setOpportunitiesIndex}
              ticks={opportunitiesTickLabels}
              valueLabel={String(opportunities)}
            />
          </div>

          <div className="relative mt-9 overflow-hidden rounded-2xl border border-brand-100 bg-[linear-gradient(135deg,var(--color-brand-50)_0%,var(--color-surface)_65%)] px-6 py-8 text-center sm:px-10 sm:py-10">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-600">
              {t("resultLabel")}
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
              {t("disclaimer")}
            </p>
          </div>

          <Button
            href="/signup"
            size="lg"
            className="mt-6 w-full"
          >
            {t("cta")}
            <ButtonIcon>→</ButtonIcon>
          </Button>
        </div>
      </Container>
    </section>
  );
}
