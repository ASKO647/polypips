"use client";

import { useEffect, useId, useMemo, useRef, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { getSimulatorCopy, type SimulatorCopy } from "./simulator-copy";
import { calculateScenario, chartBounds, chartGeometry, DEFAULT_SCENARIO, LIMITS, normalizeParameter, parseNumericInput, type Parameter, type Scenario } from "./simulator-model";
import styles from "./simulator.module.css";

type IconName = "settings" | "reset" | "calculator" | "arrow" | "chevron" | "info";
const icons: Record<IconName, ReactNode> = {
  settings: <><path d="M2 5h20M2 12h20M2 19h20" /><circle cx="8" cy="5" r="2.5" /><circle cx="16" cy="12" r="2.5" /><circle cx="7" cy="19" r="2.5" /></>,
  reset: <><path d="M20 8a8 8 0 1 0 0 8M20 3v5h-5" /></>,
  calculator: <><rect x="5" y="2" width="14" height="20" rx="1" /><path d="M8 5h8v4H8zM8 12h1m3 0h1m3 0h.1M8 15h1m3 0h1m3 0h.1M8 18h1m3 0h1m3 0h.1" /></>,
  arrow: <path d="M3 12h18m-6-6 6 6-6 6" />,
  chevron: <path d="m9 5 7 7-7 7" />,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 7v6m0 3v.1" /></>,
};
function Icon({ name }: { name: IconName }) { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{icons[name]}</svg>; }
function subscribeMotion(callback: () => void) { const media = window.matchMedia("(prefers-reduced-motion: reduce)"); media.addEventListener("change", callback); return () => media.removeEventListener("change", callback); }
function readMotion() { return window.matchMedia("(prefers-reduced-motion: reduce)").matches; }
function serverMotion() { return false; }

/** Retargets from the currently displayed values so fast slider movements never queue. */
function useAnimatedVector(target: number[], duration: number, reduced: boolean) {
  const [display, setDisplay] = useState(target);
  const current = useRef(target);
  useEffect(() => {
    const start = current.current;
    if (reduced) { current.current = target; return; }
    if (start.every((value, index) => value === target[index])) return;
    const started = window.performance.now();
    let frame = 0;
    function tick(now: number) {
      const fraction = Math.min(1, Math.max(0, (now - started) / duration));
      const progress = fraction * (2 - fraction);
      const value = target.map((end, index) => start[index] + (end - start[index]) * progress);
      current.current = value;
      setDisplay(value);
      if (fraction < 1) frame = window.requestAnimationFrame(tick);
    }
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [target, duration, reduced]);
  return reduced ? target : display;
}

function NumericControl({ parameter, value, onChange, copy, locale }: { parameter: Parameter; value: number; onChange: (parameter: Parameter, value: number) => void; copy: SimulatorCopy; locale: string }) {
  const id = useId();
  const [draft, setDraft] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const { min, max, step } = LIMITS[parameter];
  const field = copy.fields[parameter];
  const numeric = (number: number) => new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(number);
  const inputText = (number: number) => String(number).replace(".", locale === "fr" ? "," : ".");
  const unit = parameter === "stake" ? "€" : parameter === "yieldRate" ? "%" : "";
  const valid = draft === null || (parseNumericInput(draft) !== null && Number(parseNumericInput(draft)) >= min && Number(parseNumericInput(draft)) <= max);
  const percentage = (value - min) / (max - min) * 100;
  const zero = (0 - min) / (max - min) * 100;
  const start = parameter === "yieldRate" ? Math.min(zero, percentage) : 0;
  const end = parameter === "yieldRate" ? Math.max(zero, percentage) : percentage;
  function edit(raw: string) {
    setDraft(raw);
    const parsed = parseNumericInput(raw);
    if (parsed !== null && parsed >= min && parsed <= max) onChange(parameter, normalizeParameter(parameter, parsed));
  }
  function commit() {
    const parsed = draft === null ? value : parseNumericInput(draft);
    onChange(parameter, normalizeParameter(parameter, parsed ?? value));
    setDraft(null);
  }
  return <div className={styles.control} data-parameter={parameter}>
    <div className={styles.controlHeader}><div><label id={`${id}-label`} htmlFor={`${id}-number`}>{field.label}</label><p id={`${id}-description`}>{field.description}</p></div><div className={styles.numberBox}><input id={`${id}-number`} type="text" inputMode={parameter === "opportunities" ? "numeric" : "decimal"} autoComplete="off" spellCheck={false} aria-labelledby={`${id}-label`} aria-describedby={`${id}-description${valid ? "" : ` ${id}-limit`}`} aria-invalid={!valid} value={draft ?? inputText(value)} onFocus={() => setDraft(inputText(value))} onChange={(event) => edit(event.target.value)} onBlur={commit} onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }} /><span aria-hidden="true">{unit}</span></div></div>
    <div className={styles.sliderArea} data-dragging={dragging} style={{ "--fill-start": `${start}%`, "--fill-end": `${end}%` } as CSSProperties}>
      {parameter === "yieldRate" && <span className={styles.zeroTick} aria-hidden="true" />}
      <input className={styles.range} type="range" min={min} max={max} step={step} value={value} aria-labelledby={`${id}-label`} aria-describedby={`${id}-description`} aria-valuetext={`${numeric(value)} ${unit}`.trim()} onChange={(event) => onChange(parameter, Number(event.target.value))} onPointerDown={(event) => { setDragging(true); event.currentTarget.setPointerCapture?.(event.pointerId); }} onPointerUp={() => setDragging(false)} onPointerCancel={() => setDragging(false)} onLostPointerCapture={() => setDragging(false)} onBlur={() => setDragging(false)} onKeyDown={(event) => { if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End", "PageUp", "PageDown"].includes(event.key)) setDragging(true); }} onKeyUp={() => setDragging(false)} />
    </div>
    <div className={styles.ticks} aria-hidden="true"><span>{numeric(min)}{unit ? ` ${unit}` : ""}</span>{parameter === "yieldRate" && <span>0 %</span>}<span>{parameter === "yieldRate" ? "+" : ""}{numeric(max)}{unit ? ` ${unit}` : ""}</span></div>
    {!valid && <p className={styles.fieldError} id={`${id}-limit`}>{copy.limits} : {numeric(min)} {copy.to} {numeric(max)}.</p>}
  </div>;
}

function ResultChart({ profit, locale, reduced, copy }: { profit: number; locale: string; reduced: boolean; copy: SimulatorCopy }) {
  const gradientId = useId();
  const target = useMemo(() => [profit, ...chartBounds(profit)], [profit]);
  const [amount, min, max] = useAnimatedVector(target, 400, reduced);
  const geometry = chartGeometry(amount, min, max);
  const money = (value: number) => new Intl.NumberFormat(locale, { style: "currency", currency: "EUR", minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(Math.abs(value) < 0.005 ? 0 : value);
  return <figure className={styles.chart}><figcaption>{copy.illustrative}</figcaption><svg viewBox="0 0 590 220" role="img" aria-label={`${copy.chartLabel} : ${money(profit)}. ${copy.graph}`}>
    <defs><linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ff1645" stopOpacity=".78" /><stop offset="100%" stopColor="#ff1645" stopOpacity=".06" /></linearGradient></defs>
    {geometry.ticks.map((tick, index) => <g key={index}><line className={styles.gridLine} x1="58" x2="562" y1={30 + index * 37} y2={30 + index * 37} /><text className={styles.axisLabel} x="46" y={35 + index * 37} textAnchor="end">{money(tick)}</text></g>)}
    {copy.weeks.map((label, index) => <g key={label}><line className={styles.gridLine} x1={58 + index * 168} x2={58 + index * 168} y1="30" y2="178" /><text className={styles.axisLabel} x={58 + index * 168} y="208" textAnchor="middle">{label}</text></g>)}
    <line className={styles.zeroAxis} x1="58" x2="574" y1={geometry.zero} y2={geometry.zero} />
    <path className={styles.chartArea} d={geometry.area} fill={`url(#${gradientId})`} />
    <path className={styles.chartLine} d={geometry.line} pathLength="1" fill="none" />
    {geometry.points.map(([x, y], index) => <circle className={styles.chartDot} key={index} cx={x} cy={y} r="5.5" />)}
  </svg></figure>;
}

export function PotentialCalculator() {
  const language = useLocale();
  const locale = language === "en" ? "en-GB" : "fr";
  const copy = getSimulatorCopy(language);
  const reduced = useSyncExternalStore(subscribeMotion, readMotion, serverMotion);
  const [scenario, setScenario] = useState<Scenario>({ ...DEFAULT_SCENARIO });
  const [highlight, setHighlight] = useState<{ parameter: Parameter; revision: number } | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [visible, setVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const explanationId = useId();
  const calculation = calculateScenario(scenario);
  const total = calculation.total;
  const profit = Number(calculation.profit);
  const resultTarget = useMemo(() => [profit], [profit]);
  const [displayProfit] = useAnimatedVector(resultTarget, 300, reduced);
  const money = (value: number, signed = false) => new Intl.NumberFormat(locale, { style: "currency", currency: "EUR", minimumFractionDigits: 0, maximumFractionDigits: 2, signDisplay: signed ? "exceptZero" : "auto" }).format(Math.abs(value) < 0.005 ? 0 : value);
  const percent = (value: number) => `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1, signDisplay: "exceptZero" }).format(value)} %`;
  const integer = (value: number) => new Intl.NumberFormat(locale).format(value);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    if (typeof IntersectionObserver !== "function") { const frame = window.requestAnimationFrame(() => setVisible(true)); return () => window.cancelAnimationFrame(frame); }
    const observer = new IntersectionObserver((entries) => { if (entries.some((entry) => entry.isIntersecting)) { setVisible(true); observer.disconnect(); } }, { threshold: 0.12 });
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  function change(parameter: Parameter, value: number) {
    const next = normalizeParameter(parameter, value);
    if (next === scenario[parameter]) return;
    setScenario((previous) => ({ ...previous, [parameter]: next }));
    setHighlight((previous) => ({ parameter, revision: (previous?.revision ?? 0) + 1 }));
  }
  function reset() { setScenario({ ...DEFAULT_SCENARIO }); setHighlight(null); }
  function term(parameter: Parameter, value: string) { return <span key={`${parameter}-${highlight?.parameter === parameter ? highlight.revision : "idle"}`} className={highlight?.parameter === parameter ? styles.changed : undefined} data-term={parameter}>{value}</span>; }

  return <section id="simulateur" ref={sectionRef} className={styles.section} data-visible={visible} aria-labelledby="simulator-title">
    <div className={styles.container}>
      <header className={`${styles.heading} ${styles.reveal}`}><p className={styles.eyebrow}><span />{copy.eyebrow}</p><h2 id="simulator-title">{copy.title} <span>{copy.accent}</span></h2><p>{copy.description}</p></header>
      <div className={styles.panels}>
        <div className={`${styles.settingsPanel} ${styles.reveal}`}>
          <div className={styles.settingsHeader}><span className={styles.settingsIcon}><Icon name="settings" /></span><h3>{copy.settings}</h3><span className={styles.interactive}>{copy.interactive}</span><button type="button" className={styles.reset} onClick={reset}><Icon name="reset" />{copy.reset}</button></div>
          <div className={styles.controls}>{(["stake", "opportunities", "yieldRate"] as const).map((parameter) => <NumericControl key={parameter} parameter={parameter} value={scenario[parameter]} onChange={change} copy={copy} locale={locale} />)}</div>
          <div className={styles.formulaBox}><div className={styles.formulaMain}><span className={styles.calculatorIcon}><Icon name="calculator" /></span><div><p>{copy.calculation}</p><div className={styles.formula}>{term("stake", money(scenario.stake))}<b>×</b>{term("opportunities", integer(scenario.opportunities))}<b>×</b>{term("yieldRate", percent(scenario.yieldRate))}<b>=</b><span>{money(profit)}</span></div></div></div><button type="button" className={styles.explainButton} aria-expanded={expanded} aria-controls={explanationId} onClick={() => setExpanded((value) => !value)}>{copy.understand}<Icon name="chevron" /></button></div>
          <div className={styles.explanation} id={explanationId} data-expanded={expanded} aria-hidden={!expanded}><div><div className={styles.explanationInner}><p><strong>{money(scenario.stake)} × {integer(scenario.opportunities)} = {money(total)}</strong> {copy.volumeLine}.</p><p><strong>{money(total)} × {percent(scenario.yieldRate)} = {money(profit)}</strong> {copy.profitLine}.</p><p>{copy.explanation}</p><p>{copy.graph}</p></div></div></div>
        </div>
        <div className={`${styles.resultPanel} ${styles.reveal}`}>
          <p className={styles.resultLabel}>{copy.result}</p><p className={styles.resultNumber} aria-hidden="true">{money(displayProfit, true)}</p><p className={styles.beforeFees}>{copy.beforeFees}</p><span className={styles.srOnly} role="status" aria-live="polite" aria-atomic="true">{copy.result} : {money(profit, true)}. {copy.beforeFees}.</span>
          <ResultChart profit={profit} locale={locale} reduced={reduced} copy={copy} />
          <div className={styles.metrics}><div><p>{copy.total}</p><strong data-total>{money(total)}</strong></div><div><p>{copy.hypothesis}</p><strong data-yield>{percent(scenario.yieldRate)}</strong></div></div>
          <Link href="/signup" className={styles.primaryCta}>{copy.cta}<Icon name="arrow" /></Link>
        </div>
      </div>
      <p className={styles.disclaimer}><Icon name="info" />{copy.disclaimer}</p>
    </div>
  </section>;
}
