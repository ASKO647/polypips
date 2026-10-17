"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type PointerEvent } from "react";
import { useLocale } from "next-intl";
import { ArrowRight, Check, CircleDot, Pause, Play } from "lucide-react";
import { Link } from "@/i18n/navigation";
import styles from "./sport-showcase.module.css";

const leagues = [
  { name: "Serie A", file: "serie-a.svg" },
  { name: "LaLiga", file: "laliga.svg" },
  { name: "Ligue 1", file: "ligue-1.svg" },
  { name: "Premier League", file: "premier-league.svg" },
];
const probabilities = [52, 23, 25];
const copy = {
  fr: {
    badge: "POLYPIPS · ANALYSE IA SPORT", demo: "DÉMONSTRATION", title: "Barça contre Real Madrid",
    description: "Forme, confrontations et statistiques :", description2: "comprenez les scénarios du match avec Polypips.",
    outcomes: ["Victoire Barça", "Match nul", "Victoire Real Madrid"], illustrative: "Probabilités illustratives",
    ready: "Analyse prête", cta: "Analyser mon match", start: "Débuter pour", price: "0,99 €",
    disclaimer: "Exemple visuel · Les données affichées sont illustratives.", pause: "Suspendre les animations", resume: "Reprendre les animations", leagues: "Championnats de football",
  },
  en: {
    badge: "POLYPIPS · AI SPORTS ANALYSIS", demo: "DEMONSTRATION", title: "Barça versus Real Madrid",
    description: "Form, head-to-head results and statistics:", description2: "understand match scenarios with Polypips.",
    outcomes: ["Barça win", "Draw", "Real Madrid win"], illustrative: "Illustrative probabilities",
    ready: "Analysis ready", cta: "Analyse my match", start: "Get started for", price: "€0.99",
    disclaimer: "Visual example · The data shown is illustrative.", pause: "Pause animations", resume: "Resume animations", leagues: "Football leagues",
  },
};

function subscribeMotion(callback: () => void) {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}
const readMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
function subscribeVisibility(callback: () => void) {
  document.addEventListener("visibilitychange", callback);
  return () => document.removeEventListener("visibilitychange", callback);
}
const readVisibility = () => !document.hidden;
const serverFalse = () => false;

function RollingNumber({ value, index }: { value: number; index: number }) {
  return <span className={styles.number} aria-hidden="true" style={{ "--count-delay": `${1300 + index * 120}ms` } as CSSProperties}>
    {String(value).split("").map((digit, column) => {
      const digits = [...Array.from({ length: 10 }, (_, i) => i), Number(digit)];
      return <span className={styles.digitWindow} key={column}><span className={styles.digitReel}>{digits.map((n, i) => <span key={i}>{n}</span>)}</span></span>;
    })}<span className={styles.percent}>%</span>
  </span>;
}

export function SportShowcase() {
  const text = copy[useLocale() === "en" ? "en" : "fr"];
  const section = useRef<HTMLElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(false);
  const [inView, setInView] = useState(false);
  const [paused, setPaused] = useState(false);
  const reduced = useSyncExternalStore(subscribeMotion, readMotion, serverFalse);
  const visible = useSyncExternalStore(subscribeVisibility, readVisibility, serverFalse);
  const running = started && inView && visible && !paused && !reduced;

  useEffect(() => {
    const element = section.current;
    if (!element) return;
    if (typeof IntersectionObserver !== "function") {
      const id = requestAnimationFrame(() => { setStarted(true); setInView(true); });
      return () => cancelAnimationFrame(id);
    }
    const observer = new IntersectionObserver(([entry]) => {
      setInView(entry.isIntersecting);
      const height = Math.min(entry.boundingClientRect.height, entry.rootBounds?.height ?? entry.boundingClientRect.height);
      if (entry.isIntersecting && entry.intersectionRect.height >= height * 0.25) setStarted(true);
    }, { threshold: Array.from({ length: 21 }, (_, i) => i / 20) });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  function resetDepth() {
    frame.current?.style.setProperty("--pointer-x", "0");
    frame.current?.style.setProperty("--pointer-y", "0");
  }
  function moveDepth(event: PointerEvent<HTMLDivElement>) {
    if (!running || event.pointerType !== "mouse" || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const rect = event.currentTarget.getBoundingClientRect();
    frame.current?.style.setProperty("--pointer-x", String(Math.max(-1, Math.min(1, (event.clientX - rect.left) / rect.width * 2 - 1))));
    frame.current?.style.setProperty("--pointer-y", String(Math.max(-1, Math.min(1, (event.clientY - rect.top) / rect.height * 2 - 1))));
  }

  return <section id="analyse-sport-demo" ref={section} className={styles.section} aria-labelledby="sport-showcase-title">
    <div ref={frame} className={styles.frame} data-started={started} data-running={running} data-reduced={reduced} onPointerMove={moveDepth} onPointerLeave={resetDepth}>
      <div className={styles.stadiumEntrance} aria-hidden="true"><div className={styles.stadiumDepth}><img className={styles.stadium} src="/polypips-sport/stadium.webp" alt="" width="1536" height="1024" loading="lazy" /></div></div>
      <div className={styles.shade} aria-hidden="true" />
      <div className={styles.halo} aria-hidden="true" />
      <div className={styles.pitch} aria-hidden="true"><div className={styles.sweep} />{Array.from({ length: 15 }, (_, i) => <i key={i} style={{ "--dot-x": `${8 + (i * 29) % 85}%`, "--dot-y": `${10 + (i * 37) % 80}%`, "--dot-delay": `${i * 510}ms`, "--dot-duration": `${8 + i % 5}s` } as CSSProperties} />)}</div>
      <div className={`${styles.playerEntrance} ${styles.left}`} aria-hidden="true"><img className={styles.player} src="/polypips-sport/player-left.webp" alt="" width="1024" height="1536" loading="lazy" /></div>
      <div className={`${styles.playerEntrance} ${styles.right}`} aria-hidden="true"><img className={styles.player} src="/polypips-sport/player-right.webp" alt="" width="1024" height="1536" loading="lazy" /></div>

      <div className={styles.content}>
        <div className={styles.leagueWindow} tabIndex={0} role="region" aria-label={text.leagues}>
          <div className={styles.leagueTrack}>{[0, 1].map((group) => <div className={styles.leagueGroup} key={group} aria-hidden={group === 1 ? true : undefined}>{leagues.map((league) => <span className={styles.league} key={league.name}><img src={`/polypips-sport/${league.file}`} alt={league.name} width="150" height="52" loading="lazy" /></span>)}</div>)}</div>
        </div>
        <div className={styles.badge}><CircleDot aria-hidden="true" />{text.badge}</div>
        <p className={styles.demo}>{text.demo}</p>
        <h2 id="sport-showcase-title" className={styles.title} aria-label={text.title}><span><b>BARÇA</b></span><span className={styles.cross}><b>×</b></span><span><b>REAL MADRID</b></span></h2>
        <p className={styles.description}>{text.description}<br />{text.description2}</p>
        <div className={styles.probabilities}>{probabilities.map((value, index) => <div className={styles.outcome} key={value} aria-label={`${text.outcomes[index]} : ${value} %`}>
          <RollingNumber value={value} index={index} /><span className={styles.outcomeLabel}>{text.outcomes[index]}</span>
          <div className={styles.bar} aria-hidden="true"><span style={{ "--probability": `${value}%`, "--bar-delay": `${1300 + index * 120}ms` } as CSSProperties} /></div>
        </div>)}</div>
        <p className={styles.illustrative}>{text.illustrative}</p>
        <div className={styles.ready}><Check aria-hidden="true" /><span>{text.ready}</span></div>
        <div className={styles.action}>
          <div className={styles.ballDepth} aria-hidden="true"><div className={styles.ballFloat}><img src="/polypips-sport/ball.webp" alt="" width="180" height="180" loading="lazy" /></div></div>
          <div className={styles.ctaEntrance}><Link href="/signup" className={styles.cta}>{text.cta}<ArrowRight aria-hidden="true" /></Link></div>
          <p className={styles.price}>{text.start} <strong>{text.price}</strong></p>
        </div>
        <p className={styles.disclaimer}>{text.disclaimer}</p>
      </div>
      <button className={styles.pause} type="button" aria-pressed={paused} onClick={() => { resetDepth(); setPaused((value) => !value); }}>{paused ? <Play aria-hidden="true" /> : <Pause aria-hidden="true" />}<span>{paused ? text.resume : text.pause}</span></button>
    </div>
  </section>;
}
