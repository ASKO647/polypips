"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { getJourneyCopy, type JourneyCopy } from "./journey-copy";
import { useJourneyClock } from "./journey-sequence";
import styles from "./journey.module.css";

type IconName = "link" | "brain" | "target" | "chart" | "bolt" | "image" | "check" | "close" | "document" | "bars" | "globe" | "warning" | "wallet" | "fire" | "lock" | "external" | "replay" | "arrow" | "pause" | "play";
const icons: Record<IconName, ReactNode> = {
  link: <><path d="m10 14 4-4M8 16l-1 1a4 4 0 0 1-6-6l5-5a4 4 0 0 1 6 0m0 2 1-1a4 4 0 0 1 6 6l-5 5a4 4 0 0 1-6 0" /></>,
  brain: <><path d="M12 4a3 3 0 0 0-5-1.5A3.5 3.5 0 0 0 4 8a4 4 0 0 0 0 7 3.5 3.5 0 0 0 3 5.5A3 3 0 0 0 12 19V4Zm0 0a3 3 0 0 1 5-1.5A3.5 3.5 0 0 1 20 8a4 4 0 0 1 0 7 3.5 3.5 0 0 1-3 5.5A3 3 0 0 1 12 19M7 8c2 0 3 1 3 3m7-3c-2 0-3 1-3 3M4 15c2-1 4 0 4 2m12-2c-2-1-4 0-4 2" /></>,
  target: <><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></>,
  chart: <path d="M3 3v18h18M6 15l5-6 4 3 6-8" />,
  bolt: <path d="m13 2-10 12h8l-1 8L21 9h-8l1-7Z" />,
  image: <><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8" cy="8" r="1.5" /><path d="m3 17 6-6 4 4 3-3 5 5" /></>,
  check: <path d="m5 12 4 4L19 6" />,
  close: <path d="m6 6 12 12M6 18 18 6" />,
  document: <path d="M14 2H5v20h14V7l-5-5Zm0 0v6h5M8 12h8M8 16h5" />,
  bars: <path d="M5 21V12h3v9m4 0V7h3v14m4 0V3h3v18" />,
  globe: <><circle cx="12" cy="12" r="9" /><ellipse cx="12" cy="12" rx="4" ry="9" /><path d="M3 12h18" /></>,
  warning: <><path d="m12 3 10 18H2L12 3Z" /><path d="M12 9v5m0 3v.1" /></>,
  wallet: <path d="M20 8V5a2 2 0 0 0-2-2H6L3 7v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9H5a2 2 0 0 1 0-4m16 7h-5a2 2 0 0 0 0 4h5m-4-2h.01" />,
  fire: <path d="M13 2c1 5-2 6-2 9 2 0 3-1 4-3 5 5 5 13-3 14C3 22 2 14 7 9c0 3 1 4 2 4-1-5 2-6 4-11Z" />,
  lock: <><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>,
  external: <path d="M14 3h7v7m0-7L11 13M10 5H4v15h15v-6" />,
  replay: <><path d="M4 8a8 8 0 1 0 5-4M4 3v5h5" /></>,
  arrow: <path d="M4 12h16m-6-6 6 6-6 6" />,
  pause: <path d="M8 5v14m8-14v14" />,
  play: <path d="m8 4 12 8-12 8V4Z" />,
};
function Icon({ name, className }: { name: IconName; className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{icons[name]}</svg>;
}

function subscribeMotion(callback: () => void) {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}
function readMotion() { return window.matchMedia("(prefers-reduced-motion: reduce)").matches; }
function serverMotion() { return false; }
function subscribeVisibility(callback: () => void) {
  document.addEventListener("visibilitychange", callback);
  return () => document.removeEventListener("visibilitychange", callback);
}
function readVisibility() { return !document.hidden; }
function serverVisibility() { return false; }

function Skeleton({ short = false }: { short?: boolean }) {
  return <span className={short ? styles.skeletonShort : styles.skeleton} />;
}

function ImportPreview({ copy }: { copy: JourneyCopy }) {
  return <div className={styles.importPanel} aria-hidden="true"><div className={styles.urlField}><Icon name="link" /><span className={styles.urlText}>polymarket.com/…</span><Icon name="close" /></div><div className={styles.divider}><span />{copy.or}<span /></div><div className={styles.dropZone}><Icon name="image" /><span>{copy.drop}</span><div className={styles.screenshot}><strong>◇ <span>Polymarket</span></strong><Skeleton /><Skeleton short /><svg viewBox="0 0 140 28"><path d="M1 25 14 20 25 21 37 13 46 16 57 10 68 15 79 9 91 12 101 3 111 7 123 1 137 4" fill="none" stroke="#d0dded" strokeWidth="1.6" /></svg><span className={styles.cursor}>➤</span></div></div><div className={styles.addedBadge}><Icon name="check" />{copy.added}</div></div>;
}

function DataPreview({ copy, animated }: { copy: JourneyCopy; animated: boolean }) {
  const rowIcons: IconName[] = ["document", "bars", "globe"];
  return <div className={styles.dataPanel} aria-hidden="true"><div className={styles.panelHeader}><span className={styles.spinner} /><span className={styles.scanCheck}><Icon name="check" /></span><strong>{animated ? copy.analyzing : copy.analyzed}</strong></div>{copy.dataRows.map((label, index) => <div className={styles.dataRow} key={label} style={{ "--data-delay": `${index * 500}ms`, "--check-delay": `${(index + 1) * 500}ms` } as CSSProperties}><span className={styles.smallIcon}><Icon name={rowIcons[index]} /></span><div><strong>{label}</strong><span className={styles.scanTrack}><span className={styles.scanFill} /></span><Skeleton short /></div><span className={styles.rowCheck}><Icon name="check" /></span></div>)}</div>;
}

function ResultPreview({ copy }: { copy: JourneyCopy }) {
  return <div className={styles.resultPanel} aria-hidden="true"><div className={styles.panelHeader}><Icon name="chart" /><strong>{copy.yourAnalysis}</strong><span className={styles.readyBadge}><Icon name="check" />{copy.ready}</span></div><div className={styles.resultBlock} style={{ "--result-delay": "100ms" } as CSSProperties}><span className={styles.smallIcon}><Icon name="document" /></span><div><strong>{copy.scenario}</strong><div className={styles.scenarioFill}><Skeleton /><Skeleton short /></div></div></div><div className={styles.resultBlock} style={{ "--result-delay": "260ms" } as CSSProperties}><span className={styles.smallIcon}><Icon name="bars" /></span><div><strong>{copy.probability}</strong><div className={styles.gauge}><span className={styles.gaugeFill} /><span className={styles.gaugeMarker} /></div></div></div><div className={styles.resultBlock} style={{ "--result-delay": "420ms" } as CSSProperties}><span className={styles.smallIcon}><Icon name="warning" /></span><div><strong>{copy.risks}</strong><div className={styles.riskLine}><i /><Skeleton /></div><div className={styles.riskLine}><i /><Skeleton short /></div></div></div></div>;
}

function OpportunityPreview({ copy }: { copy: JourneyCopy }) {
  return <div className={styles.opportunities} aria-hidden="true"><div className={styles.followTabs}><span className={styles.tabIndicator} /><span className={styles.marketsTab}>{copy.markets}</span><span className={styles.walletsTab}>{copy.wallets}</span></div><div className={styles.followViews}>{[false, true].map((wallets) => <div className={wallets ? styles.walletsView : styles.marketsView} key={String(wallets)}>{(wallets ? copy.walletRows : copy.marketRows).map((label, index) => <div className={`${styles.followRow} ${wallets ? styles.walletEntry : styles.marketEntry}`} key={label} style={{ "--row-delay": `${(wallets ? 1650 : 180) + index * 200}ms` } as CSSProperties}><span className={styles.smallIcon}><Icon name={wallets ? "wallet" : "fire"} /></span><div><strong>{label}</strong><Skeleton /><Skeleton short /></div><svg className={styles.sparkline} viewBox="0 0 60 36"><path d="M1 32 7 30 13 20 19 22 25 26 31 15 37 10 43 14 49 7 57 1" fill="none" stroke="currentColor" strokeWidth="1.7" /></svg><span className={styles.chevron}>›</span></div>)}</div>)}</div></div>;
}

function DecisionPreview({ copy }: { copy: JourneyCopy }) {
  return <div className={styles.decisionPanel}><div className={styles.validationRows} aria-hidden="true">{copy.validations.map((label, index) => <div className={styles.validationRow} key={label} style={{ "--validation-delay": `${200 + index * 500}ms` } as CSSProperties}><span className={styles.validationCheck}><Icon name="check" /></span><div><strong>{label}</strong><Skeleton /><Skeleton short /></div></div>)}</div><a href="https://polymarket.com" target="_blank" rel="noopener noreferrer" className={styles.openMarket} aria-label={copy.openMarketAria}>{copy.openMarket}<Icon name="external" /></a><p className={styles.controlNote}><Icon name="lock" />{copy.control}</p></div>;
}

const stepIcons: IconName[] = ["link", "brain", "target", "chart", "bolt"];

export function HowItWorks() {
  const copy = getJourneyCopy(useLocale());
  const sectionRef = useRef<HTMLElement>(null);
  const gridRef = useRef<HTMLOListElement>(null);
  const itemRefs = useRef<Array<HTMLLIElement | null>>([]);
  const keyboardRef = useRef(true);
  const [revealed, setRevealed] = useState(false);
  const [visibility, setVisibility] = useState({ entered: false, inView: false });
  const [hoverPaused, setHoverPaused] = useState(false);
  const [focusPaused, setFocusPaused] = useState(false);
  const [manualPaused, setManualPaused] = useState(false);
  const reducedMotion = useSyncExternalStore(subscribeMotion, readMotion, serverMotion);
  const pageVisible = useSyncExternalStore(subscribeVisibility, readVisibility, serverVisibility);
  const allowed = visibility.inView && pageVisible && !reducedMotion && !hoverPaused && !focusPaused && !manualPaused;
  const clock = useJourneyClock(allowed);
  const active = reducedMotion ? 4 : clock.activeStep;
  const finished = reducedMotion || clock.finished;
  const demoAnimated = visibility.entered && !reducedMotion && !clock.finished && !clock.transitioning;

  useEffect(() => {
    const section = sectionRef.current;
    const grid = gridRef.current;
    if (!section || !grid) return;
    if (typeof IntersectionObserver !== "function") {
      const frame = window.requestAnimationFrame(() => { setRevealed(true); setVisibility({ entered: true, inView: true }); });
      return () => window.cancelAnimationFrame(frame);
    }
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === section && entry.isIntersecting) { setRevealed(true); observer.unobserve(section); }
        if (entry.target === grid) setVisibility((previous) => ({ entered: previous.entered || entry.isIntersecting, inView: entry.isIntersecting }));
      }
    }, { threshold: 0.1 });
    observer.observe(section);
    observer.observe(grid);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    function keyboardInput() {
      keyboardRef.current = true;
      if (gridRef.current?.contains(document.activeElement)) setFocusPaused(true);
    }
    function pointerInput() { keyboardRef.current = false; setFocusPaused(false); }
    document.addEventListener("keydown", keyboardInput, true);
    document.addEventListener("pointerdown", pointerInput, true);
    return () => { document.removeEventListener("keydown", keyboardInput, true); document.removeEventListener("pointerdown", pointerInput, true); };
  }, []);

  useEffect(() => {
    const grid = gridRef.current;
    const item = itemRefs.current[active];
    if (reducedMotion || !grid || !item || grid.scrollWidth <= grid.clientWidth) return;
    const left = grid.scrollLeft + item.getBoundingClientRect().left - grid.getBoundingClientRect().left - (grid.clientWidth - item.clientWidth) / 2;
    grid.scrollTo({ left: Math.max(0, left), behavior: "smooth" });
  }, [active, reducedMotion]);

  function replay() { setManualPaused(false); clock.goToStep(0); }

  return (
    <section id="comment-ca-marche" ref={sectionRef} className={styles.section} aria-labelledby="journey-title" data-revealed={revealed} data-running={clock.running} data-finished={finished}>
      <div className={styles.container}>
        <header className={`${styles.heading} ${styles.reveal}`}><p className={styles.eyebrow}><span />{copy.eyebrow}</p><h2 id="journey-title">{copy.title}<span>{copy.accent}</span></h2><p className={styles.description}>{copy.description}</p></header>

        <ol
          ref={gridRef}
          className={styles.steps}
          aria-label={copy.stepsLabel}
          onPointerEnter={(event) => { if (event.pointerType === "mouse") setHoverPaused(true); }}
          onPointerLeave={() => setHoverPaused(false)}
          onFocusCapture={() => { if (keyboardRef.current) setFocusPaused(true); }}
          onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocusPaused(false); }}
        >
          {copy.steps.map((step, index) => {
            const completed = index < active || finished;
            const lineState = index < active || finished ? "complete" : clock.transitioning && index === active ? "filling" : "empty";
            const animated = demoAnimated && index === active;
            return <li ref={(element) => { itemRefs.current[index] = element; }} className={`${styles.stepItem} ${styles.reveal}`} key={index} data-active={index === active} data-future={index > active} style={{ "--reveal-delay": `${index * 80}ms` } as CSSProperties}>
              {index < 4 && <span className={styles.connector} aria-hidden="true"><span key={`${clock.revision}-${index}`} className={styles.connectorFill} data-state={lineState} /></span>}
              <button type="button" className={styles.number} aria-current={index === active ? "step" : undefined} aria-label={`${String(index + 1).padStart(2, "0")} — ${step.title}${completed ? ` — ${copy.complete}` : ""}`} onClick={() => clock.goToStep(index)}>{completed ? <Icon name="check" /> : String(index + 1).padStart(2, "0")}</button>
              <article className={styles.card}><span className={styles.iconTile}><Icon name={stepIcons[index]} /></span><h3>{step.title}</h3><p className={styles.stepDescription}>{step.description}</p><div key={`${clock.revision}-${index}`} className={styles.preview} data-animated={animated}>
                {index === 0 && <ImportPreview copy={copy} />}
                {index === 1 && <DataPreview copy={copy} animated={animated} />}
                {index === 2 && <ResultPreview copy={copy} />}
                {index === 3 && <OpportunityPreview copy={copy} />}
                {index === 4 && <DecisionPreview copy={copy} />}
              </div></article>
            </li>;
          })}
        </ol>

        <p className={styles.swipeHint}>{copy.swipe}</p>
        <div className={styles.demoControls}><button type="button" className={styles.replayButton} onClick={replay}><Icon name="replay" />{copy.replay}</button>{!reducedMotion && <button type="button" className={styles.pauseButton} aria-pressed={manualPaused} onClick={() => setManualPaused((value) => !value)}><Icon name={manualPaused ? "play" : "pause"} />{manualPaused ? copy.resume : copy.pause}</button>}</div>
        <p className={styles.demoStatus}>{reducedMotion ? copy.static : clock.finished ? copy.finished : visibility.entered && !clock.running ? copy.paused : "\u00A0"}</p>
        <div className={styles.ctaArea}><Link href="/signup" className={styles.primaryCta}>{copy.cta}<Icon name="arrow" /></Link><p>{copy.offerLead} <strong>{copy.offerPrice}</strong></p></div>
      </div>
    </section>
  );
}
