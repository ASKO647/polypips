"use client";

import { useState } from "react";
import {
  Maximize2,
  Pause,
  Play,
  Settings,
  TrendingUp,
  Volume2,
} from "lucide-react";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/eyebrow";
import { CheckItem } from "@/components/ui/check-item";

const DEMO_ITEMS = [
  "Analyse d'un marché",
  "Décision IA",
  "Probabilité & Edge",
  "Explication détaillée",
  "Smart Money",
  "Coach IA",
];

function MiniStat({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "brand" }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5">
      <span className="text-[10px] font-medium uppercase tracking-wide text-white/40">
        {label}
      </span>
      <span
        className={
          "font-display text-base font-bold " +
          (tone === "brand" ? "text-brand-400" : "text-white")
        }
      >
        {value}
      </span>
    </div>
  );
}

function DemoPreview() {
  const [showComingSoon, setShowComingSoon] = useState(false);

  return (
    <div className="relative aspect-auto min-h-[22rem] w-full overflow-hidden rounded-3xl bg-[#160b0c] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.45)] ring-1 ring-white/10 sm:aspect-video sm:min-h-0">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(239,42,61,0.18),transparent_55%)]" />

      <div className="relative flex h-full flex-col gap-4 p-5 sm:p-7">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white/70">
            <TrendingUp className="h-4 w-4 text-brand-400" strokeWidth={2} />
            <span className="text-xs font-semibold uppercase tracking-wide">
              Analyse de marché
            </span>
          </div>
          <span className="flex items-center gap-1.5 text-[11px] font-medium text-white/40">
            <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-brand-500" />
            En direct
          </span>
        </div>

        <p className="max-w-sm text-[13px] font-medium leading-snug text-white/85 sm:text-sm">
          « Le prix du BTC dépassera-t-il 120 000 $ avant le 31 décembre ? »
        </p>

        <div className="flex flex-wrap gap-2 sm:gap-2.5">
          <div className="flex flex-col justify-center gap-0.5 rounded-xl bg-brand-500 px-3.5 py-2.5">
            <span className="text-[10px] font-medium uppercase tracking-wide text-white/70">
              Décision IA
            </span>
            <span className="font-display text-base font-bold text-white">
              YES
            </span>
          </div>
          <MiniStat label="Probabilité IA" value="68%" tone="brand" />
          <MiniStat label="Probabilité marché" value="51%" />
          <MiniStat label="Edge" value="+17%" tone="brand" />
          <MiniStat label="Score" value="87/100" />
        </div>

        <div className="hidden flex-1 grid-cols-2 gap-4 sm:grid">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-white/40">
              Facteurs favorables
            </p>
            <ul className="mt-2 space-y-1.5 text-xs text-white/70">
              <li className="flex items-center gap-1.5">
                <span className="h-1 w-1 rounded-full bg-emerald-400" />
                Accumulation on-chain soutenue
              </li>
              <li className="flex items-center gap-1.5">
                <span className="h-1 w-1 rounded-full bg-emerald-400" />
                Momentum institutionnel haussier
              </li>
            </ul>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-white/40">
              Risques principaux
            </p>
            <ul className="mt-2 space-y-1.5 text-xs text-white/70">
              <li className="flex items-center gap-1.5">
                <span className="h-1 w-1 rounded-full bg-brand-400" />
                Réglementation incertaine
              </li>
              <li className="flex items-center gap-1.5">
                <span className="h-1 w-1 rounded-full bg-brand-400" />
                Volatilité macro à court terme
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-auto flex items-center gap-3 pt-2">
          <Pause className="h-4 w-4 text-white/70" strokeWidth={2} />
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/15">
            <div className="h-full w-[28%] rounded-full bg-brand-500" />
          </div>
          <span className="text-[11px] font-medium tabular-nums text-white/50">
            0:37 / 2:15
          </span>
          <Volume2 className="h-4 w-4 text-white/50" strokeWidth={2} />
          <Settings className="h-4 w-4 text-white/50" strokeWidth={2} />
          <Maximize2 className="h-4 w-4 text-white/50" strokeWidth={2} />
        </div>
      </div>

      <button
        type="button"
        aria-label="Lancer la démonstration"
        onClick={() => {
          setShowComingSoon(true);
          window.setTimeout(() => setShowComingSoon(false), 2600);
        }}
        className="group absolute left-1/2 top-1/2 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-brand-500 text-white shadow-[0_18px_40px_-12px_rgba(229,35,35,0.65)] transition-transform duration-200 ease-out hover:scale-[1.04] active:scale-95"
      >
        <Play className="ml-1 h-8 w-8 fill-current" />
      </button>

      {showComingSoon && (
        <div className="absolute left-1/2 top-1/2 mt-14 -translate-x-1/2 translate-y-6 animate-fade-up rounded-full bg-white px-4 py-2 text-xs font-semibold text-ink shadow-lg">
          Vidéo bientôt disponible
        </div>
      )}
    </div>
  );
}

export function ProductDemo() {
  return (
    <section id="demonstration" className="reveal py-10 sm:py-12">
      <Container className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div className="flex flex-col gap-6">
          <Eyebrow>Voir Polypips en action</Eyebrow>
          <h2 className="font-display text-balance text-3xl font-semibold leading-[1.15] tracking-tight text-ink sm:text-4xl">
            Découvrez Polypips en 2 minutes
          </h2>
          <p className="text-balance text-base leading-relaxed text-body sm:text-lg">
            Voyez comment Polypips transforme un marché complexe en une
            analyse claire.
          </p>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-3">
            {DEMO_ITEMS.map((item) => (
              <CheckItem key={item}>{item}</CheckItem>
            ))}
          </ul>
          <div>
            <Button href="#demonstration" size="lg" className="mt-2">
              <Play className="h-4 w-4 fill-current" />
              Voir la démo (2:15)
            </Button>
          </div>
        </div>

        <DemoPreview />
      </Container>
    </section>
  );
}
