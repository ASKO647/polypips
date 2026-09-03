"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import {
  ArrowDownRight,
  ArrowUpRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Menu,
  Play,
  ShieldCheck,
} from "lucide-react";
import { Container } from "@/components/ui/container";
import {
  PROOF_PHONES,
  PROOF_PILLS,
  PROOF_STATS,
  type PhoneScreenData,
  type ProofPhone,
} from "@/lib/data/proof";
import { cn } from "@/lib/utils";

/** Shape of the `Proof.phones.<id>` translation object — every field is a
 * plain string, keyed identically to messages/<locale>/marketing.json. */
type ProofPhoneText = Record<string, string>;

function MiniSparkline({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 28"
      className={cn("h-7 w-full", className)}
      fill="none"
      aria-hidden
    >
      <path
        d="M0 22 L14 18 L28 20 L42 12 L56 15 L70 6 L84 9 L100 2"
        stroke="url(#sparkline-gradient)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <defs>
        <linearGradient id="sparkline-gradient" x1="0" y1="0" x2="100" y2="0">
          <stop offset="0%" stopColor="#ff9d9d" />
          <stop offset="100%" stopColor="#ff2d3d" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function ScreenTabs({
  active,
  items,
}: {
  active: string;
  items: string[];
}) {
  return (
    <div className="flex gap-1.5">
      {items.map((item) => (
        <span
          key={item}
          className={cn(
            "whitespace-nowrap rounded-full px-2 py-1 text-[9px] font-semibold",
            item === active
              ? "bg-brand-500 text-white"
              : "bg-white/10 text-white/50"
          )}
        >
          {item}
        </span>
      ))}
    </div>
  );
}

function PhoneScreenContent({
  screen,
  text,
}: {
  screen: PhoneScreenData;
  text: ProofPhoneText;
}) {
  if (screen.kind === "market-analysis") {
    return (
      <div className="flex flex-col gap-2.5">
        <ScreenTabs active={text.tabAi} items={[text.tabAi, text.tabSmartMoney]} />

        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
          <p className="text-[9px] font-semibold uppercase tracking-wide text-white/40">
            {text.questionLabel}
          </p>
          <p className="mt-1 text-[11px] font-medium leading-snug text-white/85">
            {text.question}
          </p>
          <span className="mt-2 inline-flex items-center gap-1 text-[9.5px] font-medium text-white/45">
            <span className="h-1 w-1 rounded-full bg-brand-400" />
            {text.tag}
          </span>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-wide text-white/40">
                {text.decisionLabel}
              </p>
              <p className="mt-1 text-lg font-bold text-emerald-400">
                {screen.decision}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-semibold uppercase tracking-wide text-white/40">
                {text.probabilityLabel}
              </p>
              <p className="mt-1 text-lg font-bold text-white">
                {screen.probability}%
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
          <div className="flex items-center justify-between">
            <p className="text-[9px] font-semibold uppercase tracking-wide text-white/40">
              {text.scoreLabel}
            </p>
            <p className="text-[11px] font-bold text-white">
              {screen.opportunityScore}/100
            </p>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-brand-500"
              style={{ width: `${screen.opportunityScore}%` }}
            />
          </div>
          <span className="mt-2 inline-flex items-center gap-1 text-[9.5px] font-medium text-white/45">
            <ShieldCheck className="h-3 w-3 text-emerald-400" />
            {text.confidenceLabel}
          </span>
        </div>

        <div className="mt-1 rounded-full bg-emerald-500 py-2 text-center text-[10.5px] font-semibold text-white">
          {text.cta}
        </div>
      </div>
    );
  }

  if (screen.kind === "history") {
    return (
      <div className="flex flex-col gap-2.5">
        <ScreenTabs active={text.tabAll} items={[text.tabAll, text.tabWinning]} />

        <div className="flex flex-col gap-2">
          {screen.items.map((item, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.04] p-2.5"
            >
              <div className="flex flex-col gap-1">
                <p className="text-[10px] font-medium leading-snug text-white/85">
                  {text[`item${i + 1}Match`]}
                </p>
                <p
                  className={cn(
                    "text-[10px] font-bold",
                    item.result === "YES" ? "text-emerald-400" : "text-rose-400"
                  )}
                >
                  {item.result} {item.percent}%
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <p
                  className={cn(
                    "text-[11px] font-bold",
                    item.positive ? "text-emerald-400" : "text-rose-400"
                  )}
                >
                  {item.amount}
                </p>
                <p className="text-[9px] text-white/35">
                  {text[`item${i + 1}Date`]}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (screen.kind === "performance") {
    return (
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between rounded-full border border-white/15 px-3 py-1.5">
          <span className="text-[10px] font-medium text-white/70">
            {text.period}
          </span>
          <ChevronDown className="h-3 w-3 text-white/40" />
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
          <p className="text-[9px] font-semibold uppercase tracking-wide text-white/40">
            {text.totalGainLabel}
          </p>
          <p className="mt-1 text-2xl font-bold text-white">
            {text.totalGain}
          </p>
          <MiniSparkline className="mt-2" />
        </div>

        <div className="flex flex-col gap-2 rounded-xl border border-white/10 bg-white/[0.04] p-3">
          {screen.stats.map((stat, i) => (
            <div
              key={stat.key}
              className={cn(
                "flex items-center justify-between",
                i > 0 && "border-t border-white/10 pt-2"
              )}
            >
              <span className="text-[10.5px] text-white/50">{text[stat.key]}</span>
              <span className="text-[11px] font-semibold text-white">
                {stat.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (screen.kind === "match-detail") {
    return (
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-center gap-3 py-1">
          <div className="flex flex-col items-center gap-1">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-700 text-[10px] font-bold text-white">
              {screen.teamA.slice(0, 2).toUpperCase()}
            </span>
            <span className="text-[8.5px] font-medium text-white/50">
              {screen.teamA}
            </span>
          </div>
          <span className="text-[10px] font-bold text-white/30">VS</span>
          <div className="flex flex-col items-center gap-1">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-zinc-500 to-zinc-800 text-[10px] font-bold text-white">
              {screen.teamB.slice(0, 2).toUpperCase()}
            </span>
            <span className="text-[8.5px] font-medium text-white/50">
              {screen.teamB}
            </span>
          </div>
        </div>

        <ScreenTabs
          active={text.tabSummary}
          items={[text.tabSummary, text.tabProbabilities, text.tabContext]}
        />

        <p className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-[10.5px] leading-snug text-white/75">
          {text.analysisText}
        </p>

        <div className="flex flex-col gap-2 rounded-xl border border-white/10 bg-white/[0.04] p-3">
          {screen.probabilities.map((p) => (
            <div key={p.key} className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-white/60">{text[p.key]}</span>
                <span className="font-semibold text-white">{p.percent}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className={cn(
                    "h-full rounded-full",
                    p.tone === "brand" ? "bg-brand-500" : "bg-white/30"
                  )}
                  style={{ width: `${p.percent}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="rounded-xl border border-white/10 bg-white/[0.04] p-2.5">
        <div className="flex items-center justify-between">
          <p className="text-[9px] font-semibold uppercase tracking-wide text-white/40">
            {text.allocationLabel}
          </p>
          <ChevronRight className="h-3 w-3 text-white/30" />
        </div>
        <p className="mt-1 text-xl font-bold text-emerald-400">
          {text.allocationValue}
        </p>
        <p className="text-[9.5px] text-white/45">{text.allocationContext}</p>
        <MiniSparkline className="mt-1.5 h-6" />
      </div>

      <p className="text-[9px] font-semibold uppercase tracking-wide text-white/40">
        {text.movementsLabel}
      </p>
      <div className="flex flex-col gap-1.5">
        {screen.movements.map((m) => (
          <div
            key={m.key}
            className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.04] p-2"
          >
            <div className="flex items-center gap-1.5">
              <span
                className={cn(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                  m.positive ? "bg-emerald-500/20" : "bg-rose-500/20"
                )}
              >
                {m.positive ? (
                  <ArrowUpRight className="h-2.5 w-2.5 text-emerald-400" />
                ) : (
                  <ArrowDownRight className="h-2.5 w-2.5 text-rose-400" />
                )}
              </span>
              <span className="text-[9.5px] font-medium leading-snug text-white/80">
                {text[m.key]}
              </span>
            </div>
            <span
              className={cn(
                "text-[10px] font-bold",
                m.positive ? "text-emerald-400" : "text-rose-400"
              )}
            >
              {m.amount}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PhoneMockup({ phone, text }: { phone: ProofPhone; text: ProofPhoneText }) {
  return (
    <div className="w-[196px] shrink-0 overflow-hidden rounded-[32px] border-[6px] border-black bg-black shadow-[0_20px_45px_-16px_rgba(18,5,7,0.35)]">
      <div className="flex h-[446px] flex-col overflow-hidden rounded-[26px] bg-[#160b0c]">
        <div className="flex items-center justify-between px-3.5 pt-3.5">
          <span className="inline-flex items-center gap-1.5">
            <Image
              src="/polypips-mark.png"
              alt=""
              width={290}
              height={322}
              className="h-3.5 w-auto"
            />
            <span className="font-display text-[10px] font-bold tracking-tight text-white">
              POLYPIPS
            </span>
          </span>
          <Menu className="h-3.5 w-3.5 text-white/50" />
        </div>

        <h3 className="px-3.5 pb-2.5 pt-2 font-display text-[13px] font-bold text-white">
          {text.appTitle}
        </h3>

        <div className="flex-1 overflow-hidden px-3.5 pb-3.5">
          <PhoneScreenContent screen={phone.screen} text={text} />
        </div>
      </div>
    </div>
  );
}

function ProofResultCard({ phone, text }: { phone: ProofPhone; text: ProofPhoneText }) {
  const t = useTranslations("Proof");
  const [showComingSoon, setShowComingSoon] = useState(false);

  return (
    <div className="flex w-[196px] shrink-0 flex-col gap-1.5">
      <p className="text-[13px] font-semibold text-ink">{text.resultHeadline}</p>
      <p className="font-display text-[26px] font-bold leading-none text-brand-500">
        {text.resultGain}
      </p>
      <p className="text-xs text-body-soft">{text.resultContext}</p>

      <div className="relative mt-1.5 flex items-center justify-between">
        <span className="flex items-center gap-2">
          <span
            className={cn(
              "h-8 w-8 rounded-full bg-gradient-to-br",
              phone.avatarGradient
            )}
          />
          <span className="text-sm font-medium text-body">{text.handle}</span>
        </span>
        <button
          type="button"
          aria-label={t("watchTestimonial", { handle: text.handle })}
          onClick={() => {
            setShowComingSoon(true);
            window.setTimeout(() => setShowComingSoon(false), 2200);
          }}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-500 text-white shadow-[0_10px_22px_-8px_rgba(229,35,35,0.6)] transition-transform duration-150 ease-out hover:scale-105 active:scale-95"
        >
          <Play className="ml-0.5 h-3.5 w-3.5 fill-current" />
        </button>

        {showComingSoon && (
          <div className="absolute right-0 top-11 z-10 animate-fade-up whitespace-nowrap rounded-full bg-ink-solid px-3 py-1.5 text-[11px] font-semibold text-white shadow-lg">
            {t("videoComingSoon")}
          </div>
        )}
      </div>
    </div>
  );
}

export function ProofShowcase() {
  const t = useTranslations("Proof");
  const scrollerRef = useRef<HTMLDivElement>(null);

  const scrollBy = (direction: -1 | 1) => {
    scrollerRef.current?.scrollBy({
      left: direction * 236,
      behavior: "smooth",
    });
  };

  return (
    <section className="reveal py-10 sm:py-12">
      <Container className="flex flex-col gap-8">
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 text-center">
          <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-brand-600">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
            {t("eyebrow")}
          </span>
          <h2 className="font-display text-balance text-3xl font-semibold leading-[1.15] tracking-tight text-ink sm:text-4xl lg:text-[2.75rem]">
            {t("title1")}
            <br />
            <span className="text-brand-500">{t("title2")}</span>
          </h2>
          <p className="text-balance text-base leading-relaxed text-body sm:text-lg">
            {t("description")}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {PROOF_STATS.map((stat) => (
            <div
              key={stat.id}
              className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-500">
                <stat.icon className="h-4.5 w-4.5" strokeWidth={2.25} />
              </span>
              <span className="flex flex-col">
                <span className="font-display text-xl font-bold text-ink">
                  {t(`stats.${stat.id}.value`)}
                </span>
                <span className="text-xs font-medium text-body-soft">
                  {t(`stats.${stat.id}.label`)}
                </span>
              </span>
            </div>
          ))}
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => scrollBy(-1)}
            aria-label={t("prev")}
            className="absolute left-2 top-[229px] z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white text-ink shadow-[0_8px_20px_-6px_rgba(18,5,7,0.18)] transition-all duration-150 ease-out hover:scale-105 active:scale-95 sm:flex"
          >
            <ChevronLeft className="h-4.5 w-4.5" />
          </button>
          <button
            type="button"
            onClick={() => scrollBy(1)}
            aria-label={t("next")}
            className="absolute right-2 top-[229px] z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white text-ink shadow-[0_8px_20px_-6px_rgba(18,5,7,0.18)] transition-all duration-150 ease-out hover:scale-105 active:scale-95 sm:flex"
          >
            <ChevronRight className="h-4.5 w-4.5" />
          </button>

          <div
            ref={scrollerRef}
            className="-mx-6 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth px-6 pb-2 scroll-pl-6 scroll-pr-6 [scrollbar-width:none] sm:px-[56px] sm:scroll-pl-[56px] sm:scroll-pr-[56px] lg:-mx-8 lg:px-[56px] lg:scroll-pl-[56px] lg:scroll-pr-[56px] [&::-webkit-scrollbar]:hidden"
          >
            {PROOF_PHONES.map((phone) => {
              const text = t.raw(`phones.${phone.id}`) as ProofPhoneText;
              return (
                <div
                  key={phone.id}
                  className="flex shrink-0 snap-start flex-col items-center gap-5"
                >
                  <PhoneMockup phone={phone} text={text} />
                  <ProofResultCard phone={phone} text={text} />
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          {PROOF_PILLS.map((pill) => (
            <span
              key={pill.id}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-body"
            >
              <pill.icon className="h-4 w-4 text-brand-500" strokeWidth={2.25} />
              {t(`pills.${pill.id}`)}
            </span>
          ))}
        </div>
      </Container>
    </section>
  );
}
