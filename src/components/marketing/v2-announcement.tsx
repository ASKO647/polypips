"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import { ArrowRight, Bell, CalendarDays, ChartNoAxesColumnIncreasing, Check, ChevronDown, ChevronRight, CircleDot, FileText, Pause, Play, Search, Sparkles, Wallet } from "lucide-react";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { getV2Copy } from "./v2-copy";
import styles from "./v2-launch.module.css";

function subscribeMotion(callback: () => void) { const media = window.matchMedia("(prefers-reduced-motion: reduce)"); media.addEventListener("change", callback); return () => media.removeEventListener("change", callback); }
function readMotion() { return window.matchMedia("(prefers-reduced-motion: reduce)").matches; }
function serverMotion() { return false; }
function subscribeVisibility(callback: () => void) { document.addEventListener("visibilitychange", callback); return () => document.removeEventListener("visibilitychange", callback); }
function readVisibility() { return !document.hidden; }
function serverVisibility() { return false; }
const featureIcons = [CircleDot, Wallet, ChartNoAxesColumnIncreasing, Bell, FileText];
const featureRoutes = ["/dashboard/sports", "/dashboard/copy-trading", "/dashboard/markets", "/dashboard/copy-trading", "/dashboard/sports/mes-analyses"];

function SportIcon({ sport }: { sport: number }) {
  return <svg className={styles.sportEmoji} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{sport === 2 ? <><ellipse cx="14" cy="9" rx="6" ry="8" transform="rotate(35 14 9)" /><path d="m9 14-6 8m7-9 7-10M8 8l10 7M11 4l10 7M8 13l11-8M10 17l11-8" /></> : sport === 1 ? <><circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2v20M5 4c9 7 9 9 0 16M19 4c-9 7-9 9 0 16" /></> : <><circle cx="12" cy="12" r="10" /><path d="m12 7 5 4-2 6H9l-2-6 5-4Zm0 0V2m5 9 5-2m-7 8 3 4m-9-4-3 4m1-10L2 9" /></>}</svg>;
}

export function V2Announcement() {
  const copy = getV2Copy(useLocale());
  const [sport, setSport] = useState(0);
  const [started, setStarted] = useState(false);
  const [inView, setInView] = useState(false);
  const [paused, setPaused] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const reduced = useSyncExternalStore(subscribeMotion, readMotion, serverMotion);
  const pageVisible = useSyncExternalStore(subscribeVisibility, readVisibility, serverVisibility);
  const running = started && inView && pageVisible && !paused;
  const names = sport === 2 ? copy.player : copy.team;
  const searchLabel = sport === 2 ? copy.searchPlayer : copy.searchTeam;

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    if (typeof IntersectionObserver !== "function") { const frame = window.requestAnimationFrame(() => { setStarted(true); setInView(true); }); return () => window.cancelAnimationFrame(frame); }
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        setInView(entry.isIntersecting);
        // On a tall mobile block, 40% means 40% of its viewport-sized portion.
        const referenceHeight = Math.min(entry.boundingClientRect.height, entry.rootBounds?.height ?? entry.boundingClientRect.height);
        const fraction = referenceHeight > 0 ? entry.intersectionRect.height / referenceHeight : entry.intersectionRatio;
        if (entry.isIntersecting && (entry.intersectionRatio >= 0.4 || fraction >= 0.4)) setStarted(true);
      }
    }, { threshold: Array.from({ length: 21 }, (_, index) => index / 20) });
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  return <section id="nouveautes" ref={sectionRef} className={styles.section} aria-labelledby="v2-title">
    <div className={styles.frame} data-started={started} data-running={running} data-reduced={reduced}>
      <div className={styles.watermark} aria-hidden="true">V2</div>
      <div className={styles.upper}>
        <div className={styles.copy}>
          <span className={styles.badge}><Sparkles aria-hidden="true" />{copy.badge}</span>
          <h2 id="v2-title">{copy.title.map((line, index) => <span key={line} style={{ "--line-delay": `${index * 80}ms` } as CSSProperties}>{line}</span>)}</h2>
          <p className={styles.description}>{copy.description}</p>
          <p className={styles.available}><span><Check aria-hidden="true" /></span>{copy.available}</p>
          <Link href="/signup" className={styles.primaryCta}>{copy.cta}<ArrowRight aria-hidden="true" /></Link>
          <p className={styles.ctaNote}>{copy.note}</p>
        </div>
        <div className={styles.previews} aria-label={copy.preview}>
          <Link href="/dashboard/markets" className={styles.refresh}><CalendarDays aria-hidden="true" />{copy.refresh}</Link>
          <div className={styles.sportPanel}>
            <div className={styles.panelHeading}><span className={styles.iconTile}><SportIcon sport={sport} /></span><Link href="/dashboard/sports">{copy.sport}</Link><span className={styles.new}>{copy.new}</span></div>
            <div className={styles.sportTabs} role="group" aria-label={copy.sport}>{copy.sports.map((label, index) => <button key={label} type="button" aria-pressed={sport === index} onClick={() => setSport(index)} className={sport === index ? styles.activeTab : undefined}><SportIcon sport={index} />{label}</button>)}</div>
            <div className={styles.teamFields}>{names.map((name) => <Link href="/dashboard/sports" className={styles.teamField} key={name}><strong>{name}</strong><span><Search aria-hidden="true" />{searchLabel}<ChevronDown className={styles.down} aria-hidden="true" /></span></Link>)}</div>
            <p className={styles.matchesTitle}>{copy.upcoming}</p>
            <div className={styles.matches}>{[0, 1, 2].map((index) => <Link key={index} href="/dashboard/sports" className={styles.matchRow} style={{ "--match-delay": `${650 + index * 120}ms` } as CSSProperties} aria-label={`${copy.matches} — ${copy.sports[sport]}`}><CalendarDays aria-hidden="true" /><span aria-hidden="true" /><small aria-hidden="true">vs</small><span aria-hidden="true" /><ChevronRight aria-hidden="true" /></Link>)}</div>
          </div>
          <Link href="/dashboard/copy-trading" className={styles.walletPanel}>
            <div className={styles.walletHeading}><span className={styles.iconTile}><Wallet aria-hidden="true" /></span><div><strong>{copy.wallet}</strong><span>0x7A...3F2</span></div><i aria-hidden="true" /></div>
            <p>{copy.position}</p>
            <svg className={styles.walletChart} viewBox="0 0 250 80" aria-hidden="true"><path className={styles.chartArea} d="M1 66 18 60 29 64 45 56 57 52 75 58 92 62 106 55 122 48 139 53 155 47 168 32 183 26 200 29 217 16 233 20 249 5V80H1Z" fill="currentColor" /><path className={styles.chartLine} d="M1 66 18 60 29 64 45 56 57 52 75 58 92 62 106 55 122 48 139 53 155 47 168 32 183 26 200 29 217 16 233 20 249 5" pathLength="1" fill="none" /></svg>
          </Link>
        </div>
      </div>
      <ul className={styles.features}>{copy.features.map((feature, index) => { const FeatureIcon = featureIcons[index]; return <li key={feature.title} style={{ "--feature-delay": `${400 + index * 70}ms` } as CSSProperties}><Link href={featureRoutes[index]}><span className={styles.iconTile}>{index === 0 ? <SportIcon sport={0} /> : <FeatureIcon aria-hidden="true" />}</span><div><h3>{feature.title}</h3><p>{feature.description}</p></div><span className={styles.featureArrow}><ChevronRight aria-hidden="true" /></span></Link></li>; })}</ul>
      {!reduced && <button type="button" className={styles.pauseButton} aria-pressed={paused} onClick={() => setPaused((value) => !value)}>{paused ? <Play aria-hidden="true" /> : <Pause aria-hidden="true" />}{paused ? copy.resume : copy.pause}</button>}
    </div>
  </section>;
}
