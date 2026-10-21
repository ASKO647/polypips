"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type ReactNode, type RefObject } from "react";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { getFeaturesCopy, type FeaturesCopy } from "./features-copy";
import styles from "./features-showcase.module.css";

type IconName = "brain" | "wallet" | "football" | "basket" | "tennis" | "chart" | "sparkles" | "document" | "bars" | "warning" | "bank" | "cube" | "target" | "arrow" | "check";

const drawings: Record<IconName, ReactNode> = {
    brain: <><path d="M12 4a3 3 0 0 0-5-1.5A3.5 3.5 0 0 0 4 8a4 4 0 0 0 0 7 3.5 3.5 0 0 0 3 5.5A3 3 0 0 0 12 19V4Z" /><path d="M12 4a3 3 0 0 1 5-1.5A3.5 3.5 0 0 1 20 8a4 4 0 0 1 0 7 3.5 3.5 0 0 1-3 5.5A3 3 0 0 1 12 19M7 8c2 0 3 1 3 3M4 15c2-1 4 0 4 2M17 8c-2 0-3 1-3 3M20 15c-2-1-4 0-4 2" /></>,
    wallet: <><path d="M20 8V5a2 2 0 0 0-2-2H6L3 7v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9H5a2 2 0 0 1 0-4" /><path d="M21 12h-5a2 2 0 0 0 0 4h5M17 14h.01" /></>,
    football: <><circle cx="12" cy="12" r="9" /><path d="m12 7 5 4-2 6H9l-2-6 5-4Zm0 0V3m5 8 4-2m-6 8 2 3M9 17l-2 3M7 11 3 9" /></>,
    basket: <><circle cx="12" cy="12" r="9" /><path d="M12 3v18M3 12h18M5.5 5.5c8 1 8 12 13 13M18.5 5.5c-8 1-8 12-13 13" /></>,
    tennis: <><circle cx="12" cy="12" r="9" /><path d="M6 5c6 4 6 10 0 14M18 5c-6 4-6 10 0 14" /></>,
    chart: <><path d="M3 3v18h18M6 16l5-6 4 3 6-8" /></>,
    sparkles: <><path d="m12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5L12 2ZM20 2v5m-2.5-2.5h5" /></>,
    document: <><path d="M14 2H5v20h14V7l-5-5Zm0 0v6h5M8 12h8M8 16h5" /></>,
    bars: <path d="M5 21V12h3v9m4 0V7h3v14m4 0V3h3v18" />,
    warning: <><path d="m12 3 10 18H2L12 3Z" /><path d="M12 9v5m0 3v.1" /></>,
    bank: <><path d="m2 8 10-6 10 6H2Zm1 13h18M5 10v8m5-8v8m4-8v8m5-8v8" /></>,
    cube: <><path d="m12 2 9 5v10l-9 5-9-5V7l9-5Zm0 10 9-5M12 12 3 7m9 5v10" /></>,
    target: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><path d="m12 12 9-9m-3 0h3v3" /></>,
    arrow: <path d="M4 12h16m-6-6 6 6-6 6" />,
    check: <path d="m5 12 4 4L19 6" />,
};

function Icon({ name, className }: { name: IconName; className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{drawings[name]}</svg>;
}

function useReveal(ref: RefObject<HTMLElement | null>, keepWatching = false) {
  const [motion, setMotion] = useState({ ready: false, entered: false, inView: false });
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (typeof IntersectionObserver !== "function") {
      const frame = window.requestAnimationFrame(() => setMotion({ ready: true, entered: true, inView: true }));
      return () => window.cancelAnimationFrame(frame);
    }
    const observer = new IntersectionObserver(([entry]) => {
      setMotion((previous) => ({ ready: true, entered: previous.entered || entry.isIntersecting, inView: entry.isIntersecting }));
      if (entry.isIntersecting && !keepWatching) observer.unobserve(element);
    }, { threshold: 0.12 });
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, keepWatching]);
  return motion;
}

function subscribeMotion(callback: () => void) {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}
function readReducedMotion() { return window.matchMedia("(prefers-reduced-motion: reduce)").matches; }
function serverReducedMotion() { return true; }
function subscribeVisibility(callback: () => void) {
  document.addEventListener("visibilitychange", callback);
  return () => document.removeEventListener("visibilitychange", callback);
}
function readPageVisible() { return !document.hidden; }
function serverPageVisible() { return false; }

function Card({ kind, index, children }: { kind: string; index: number; children: ReactNode | ((active: boolean) => ReactNode) }) {
  const cardRef = useRef<HTMLElement>(null);
  const motion = useReveal(cardRef, kind === "sport");
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  return (
    <article
      ref={cardRef}
      className={`${styles.card} ${styles.reveal}`}
      data-kind={kind}
      data-ready={motion.ready}
      data-entered={motion.entered}
      style={{ "--reveal-delay": `${index * 80}ms` } as CSSProperties}
      onMouseEnter={kind === "sport" ? () => setHovered(true) : undefined}
      onMouseLeave={kind === "sport" ? () => setHovered(false) : undefined}
      onFocusCapture={kind === "sport" ? () => setFocused(true) : undefined}
      onBlurCapture={kind === "sport" ? (event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false);
      } : undefined}
    >
      {typeof children === "function" ? children(motion.inView && !hovered && !focused) : children}
    </article>
  );
}

function FeatureHeading({ icon, title, description }: { icon: IconName; title: string; description?: string }) {
  return <div className={styles.cardHeading}><span className={styles.iconTile}><Icon name={icon} /></span><div><h3>{title}</h3>{description && <p>{description}</p>}</div></div>;
}

function FeatureLink({ href, children }: { href: string; children: ReactNode }) {
  return <Link className={styles.featureLink} href={href}>{children}<Icon name="arrow" className={styles.linkArrow} /></Link>;
}

const analysisPath = "M0 64 7 62 13 52 19 57 25 51 32 49 39 37 46 43 52 40 59 48 66 42 73 36 80 40 87 50 94 46 101 53 108 48 115 55 122 44 129 40 136 32 143 37 150 25 157 30 164 33 171 42 178 45 185 40 192 43 199 39 206 40 213 34 220 36 227 24 234 17 241 19 248 13 255 21 262 18 269 26 276 19 283 22 290 16 297 12 304 7 311 11 318 8 325 11 332 5 340 1";

function AnalysisPreview({ copy }: { copy: FeaturesCopy["analysis"] }) {
  const resultIcons: IconName[] = ["document", "bars", "warning"];
  return (
    <div className={styles.analysisPreview} aria-hidden="true">
      <div className={styles.previewTop}><strong>{copy.panel}</strong><span className={styles.analysisStatus}><span className={styles.analysisWorking}><span className={styles.statusDot} />{copy.working}</span><span className={styles.analysisDone}><Icon name="check" />{copy.done}</span></span></div>
      <svg className={styles.analysisChart} viewBox="0 0 340 78" preserveAspectRatio="none">
        <path d="M0 19H340M0 39H340M0 59H340M1 0V78M85 0V78M170 0V78M255 0V78M339 0V78" stroke="#eef0f4" strokeWidth=".6" />
        <path className={styles.analysisArea} d={`${analysisPath}V78H0Z`} fill="#ff1647" fillOpacity=".07" />
        <path className={styles.analysisTrace} d={analysisPath} pathLength="1" fill="none" stroke="#ff0738" strokeWidth="1.8" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className={styles.resultList}>{copy.results.map((label, index) => <div className={styles.resultRow} style={{ "--result-delay": `${1400 + index * 260}ms` } as CSSProperties} key={label}><span className={styles.miniIcon}><Icon name={resultIcons[index]} /></span><div><strong>{label}</strong><span className={styles.skeleton} /><span className={styles.skeletonShort} /></div><span className={styles.chevron}>›</span></div>)}</div>
    </div>
  );
}

function WalletPreview({ copy }: { copy: FeaturesCopy["wallet"] }) {
  return (
    <div className={styles.walletPreview} aria-hidden="true">
      <div className={styles.walletTop}><svg className={styles.identicon} viewBox="0 0 40 40"><circle cx="20" cy="20" r="20" fill="#ececec" /><path d="M5 8h7v7H5Zm14-7h7v9h-7Zm8 10h10v8H27ZM9 20h9v11H9Zm15 8h10v9H24ZM0 30h8v10H0Zm16-16h8v8h-8ZM30 0h10v7H30ZM2 0h9v5H2Z" fill="#858585" /><path d="M12 7h7v11h-7Zm10 14h8v7h-8ZM9 32h9v8H9Zm24-12h7v9h-7Z" fill="#b7b7b7" /></svg><strong>0x7A...3F2</strong><span className={styles.followBadge}><Icon name="check" />{copy.following}</span></div>
      <div className={styles.walletTabs}><span>{copy.positions}</span><span>{copy.activity}</span></div>
      <div className={`${styles.walletRow} ${styles.walletNew}`}><span className={styles.buyDot} /><div><strong>{copy.buy}</strong><span className={styles.skeletonShort} /></div><small>{copy.recent}</small></div>
      <div className={styles.walletRow}><span className={styles.sellDot} /><div><strong>{copy.sell}</strong><span className={styles.skeletonShort} /></div><small>{copy.earlier}</small></div>
    </div>
  );
}

const sportScores = [[68, 43, 28], [80, 58, 35], [61, 73, 22]] as const;
const sportIcons: IconName[] = ["football", "basket", "tennis"];

function SportPreview({ copy, active }: { copy: FeaturesCopy["sport"]; active: boolean }) {
  const [sport, setSport] = useState(0);
  const reducedMotion = useSyncExternalStore(subscribeMotion, readReducedMotion, serverReducedMotion);
  const pageVisible = useSyncExternalStore(subscribeVisibility, readPageVisible, serverPageVisible);
  useEffect(() => {
    if (!active || reducedMotion || !pageVisible) return;
    const interval = window.setInterval(() => setSport((previous) => (previous + 1) % 3), 5000);
    return () => window.clearInterval(interval);
  }, [active, reducedMotion, pageVisible]);
  return (
    <div className={styles.sportPreview}>
      <div className={styles.sportTabs} role="group" aria-label={copy.selector}>{copy.sports.map((label, index) => <button type="button" aria-pressed={sport === index} onClick={() => setSport(index)} key={label}><Icon name={sportIcons[index]} /><span>{label}</span></button>)}</div>
      <div className={styles.sportPanel}><strong>{copy.panel}</strong>{copy.metrics.map((label, index) => <div className={styles.metric} key={label}><span>{label}</span><span className={styles.track} aria-hidden="true"><span style={{ width: `${sportScores[sport][index]}%` }} /></span></div>)}</div>
    </div>
  );
}

const closes = [51, 63, 56, 49, 43, 29, 25, 20, 25, 31, 39, 45, 37, 31, 25, 21, 34, 29, 38, 44, 52, 61, 56, 50, 47, 42, 34, 40, 56, 58, 65];

function TradingPreview({ copy }: { copy: FeaturesCopy["trading"] }) {
  return (
    <div className={styles.tradingPreview} aria-hidden="true">
      <div className={styles.tradingTabs}><span><Icon name="chart" />{copy.trend}</span><span><Icon name="target" />{copy.targets}</span></div>
      <svg className={styles.candleChart} viewBox="0 0 360 140" preserveAspectRatio="none">
        <path d="M0 32H360M0 58H360M0 84H360M0 110H360M12 0V140M72 0V140M132 0V140M192 0V140M252 0V140M312 0V140" stroke="#eef0f4" strokeWidth=".65" />
        {closes.map((close, index) => {
          const open = index ? closes[index - 1] : 42;
          const x = 7 + index * 11.5;
          const up = close >= open;
          const color = up ? "#394653" : "#ff1647";
          return <g className={styles.candle} key={index} style={{ "--candle-delay": `${Math.round(index * 1000 / (closes.length - 1))}ms` } as CSSProperties}><line x1={x} x2={x} y1={100 - Math.max(open, close) - 5} y2={100 - Math.min(open, close) + 5} stroke={color} strokeWidth="1" /><rect x={x - 3.2} y={100 - Math.max(open, close)} width="6.4" height={Math.max(3, Math.abs(close - open))} fill={color} /><rect x={x - 3.2} y={128 - (index * 7 % 16)} width="6.4" height={12 + (index * 7 % 16)} fill={color} opacity=".15" /></g>;
        })}
        <g className={styles.chartLevels}><path d="M0 26H360" stroke="#ff1647" strokeDasharray="3 3" /><rect x="266" y="5" width="89" height="18" rx="8" fill="#fff0f3" /><text x="310" y="17" textAnchor="middle" fill="#ef0035" fontSize="10">{copy.resistance}</text><path d="M0 102H360" stroke="#00b77c" strokeDasharray="3 3" /><rect x="291" y="106" width="64" height="18" rx="8" fill="#e2fbef" /><text x="323" y="118" textAnchor="middle" fill="#009e68" fontSize="10">{copy.support}</text></g>
      </svg>
    </div>
  );
}

const marketPaths = ["M2 30 8 27 14 29 20 22 26 25 32 19 38 22 44 18 50 22 56 13 62 10 68 15 74 12 80 16 86 11 92 12 100 7", "M2 31 8 28 14 30 20 23 26 27 32 22 38 26 44 24 50 28 56 17 62 12 68 16 74 13 80 19 86 16 92 17 100 10", "M2 30 8 27 14 29 20 22 26 26 32 20 38 25 44 21 50 23 56 14 62 16 68 9 74 13 80 11 86 17 92 15 100 7"];
const marketIcons: IconName[] = ["bank", "cube", "bars"];

function MarketsPreview({ copy }: { copy: FeaturesCopy["markets"] }) {
  return <div className={styles.marketList}>{copy.categories.map((label, index) => <Link href="/dashboard/markets" className={styles.marketRow} key={label}><span className={styles.miniIcon}><Icon name={marketIcons[index]} /></span><strong>{label}</strong><svg className={styles.miniChart} viewBox="0 0 102 38" aria-hidden="true"><path d={`${marketPaths[index]}V38H2Z`} fill="#ff1647" fillOpacity=".035" /><path className={styles.marketCurve} d={marketPaths[index]} pathLength="1" fill="none" stroke="#ff0738" strokeWidth="1.4" style={{ "--curve-delay": `${index * 700}ms` } as CSSProperties} /></svg><span className={styles.chevron} aria-hidden="true">›</span></Link>)}</div>;
}

export function FeatureSection() {
  const copy = getFeaturesCopy(useLocale());
  const headingRef = useRef<HTMLElement>(null);
  const heading = useReveal(headingRef);
  return (
    <section id="fonctionnalites" className={styles.section} aria-labelledby="polypips-features-title">
      <div className={styles.container}>
        <header ref={headingRef} className={`${styles.heading} ${styles.reveal}`} data-ready={heading.ready} data-entered={heading.entered}>
          <p className={styles.eyebrow}><span />{copy.eyebrow}</p>
          <h2 id="polypips-features-title">{copy.title} <span>{copy.titleAccent}</span></h2>
          <p className={styles.description}>{copy.description}</p>
        </header>

        <div className={styles.grid}>
          <Card kind="analysis" index={0}><div className={styles.analysisCopy}><span className={styles.iconTile}><Icon name="brain" /></span><h3>{copy.analysis.title}</h3><p>{copy.analysis.description}</p><div className={styles.tags}>{copy.analysis.tags.map((tag) => <span key={tag}>{tag}</span>)}</div><FeatureLink href="/dashboard/analyse-ia">{copy.analysis.cta}</FeatureLink></div><AnalysisPreview copy={copy.analysis} /></Card>

          <Card kind="wallet" index={1}><FeatureHeading icon="wallet" title={copy.wallet.title} /><p className={styles.cardDescription}>{copy.wallet.description}</p><WalletPreview copy={copy.wallet} /><FeatureLink href="/dashboard/copy-trading">{copy.wallet.cta}</FeatureLink></Card>

          <Card kind="sport" index={2}>{(active) => <><FeatureHeading icon="football" title={copy.sport.title} /><p className={styles.cardDescription}>{copy.sport.description}</p><SportPreview copy={copy.sport} active={active} /><FeatureLink href="/dashboard/sports">{copy.sport.cta}</FeatureLink></>}</Card>

          <Card kind="trading" index={3}><FeatureHeading icon="chart" title={copy.trading.title} description={copy.trading.description} /><TradingPreview copy={copy.trading} /><FeatureLink href="/dashboard/trading">{copy.trading.cta}</FeatureLink></Card>

          <Card kind="markets" index={4}><FeatureHeading icon="sparkles" title={copy.markets.title} /><p className={styles.cardDescription}>{copy.markets.description}</p><MarketsPreview copy={copy.markets} /><FeatureLink href="/dashboard/markets">{copy.markets.cta}</FeatureLink></Card>
        </div>

        <div className={styles.bottomCta}><Link href="/signup" className={styles.primaryCta}><span className={styles.fullCta}>{copy.cta}</span><span className={styles.shortCta}>{copy.shortCta}</span><Icon name="arrow" className={styles.linkArrow} /></Link><p>{copy.support}</p></div>
      </div>
    </section>
  );
}
