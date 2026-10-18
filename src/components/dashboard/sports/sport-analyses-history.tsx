"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale } from "next-intl";
import {
  ArrowRight, BarChart3, BrainCircuit, Check, ChevronDown, FileDown,
  FolderOpen, Grid2X2, Info, List, Lock, Plus, Search, Share2,
  ShieldCheck, Target, Trophy,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { DashboardChrome } from "@/components/dashboard/shared/dashboard-chrome";
import { SportMatchResult } from "@/components/dashboard/sports/sport-match-result";
import type { SportMatchAnalysis } from "@/lib/data/sports-analysis";
import styles from "./sport-history.module.css";

type SportFilter = "all" | "football" | "basketball" | "tennis";

function Counter({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (!value) return setDisplay(0);
    const started = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      setDisplay(Math.round(value * Math.min((now - started) / 550, 1)));
      if (now - started < 550) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);
  return <>{display}</>;
}

function readableDate(value: string, locale: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat(locale, { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

export function SportAnalysesHistory({ analyses }: { analyses: SportMatchAnalysis[] }) {
  const locale = useLocale();
  const fr = locale === "fr";
  const [selected, setSelected] = useState<SportMatchAnalysis | null>(null);
  const [sport, setSport] = useState<SportFilter>("all");
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");

  const counts = useMemo(() => ({
    all: analyses.length,
    football: analyses.filter(a => a.sport === "football").length,
    basketball: analyses.filter(a => a.sport === "basketball").length,
    tennis: analyses.filter(a => a.sport === "tennis").length,
  }), [analyses]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase(locale);
    return analyses.filter(a => {
      const matchesSport = sport === "all" || a.sport === sport;
      const matchesQuery = !needle || `${a.participants} ${a.competition ?? ""}`.toLocaleLowerCase(locale).includes(needle);
      return matchesSport && matchesQuery;
    });
  }, [analyses, sport, query, locale]);

  if (selected) {
    return (
      <DashboardChrome title={fr ? "Mes analyses Sport" : "My sport analyses"}>
        <main className={styles.resultPage}>
          <SportMatchResult analysis={selected} onBack={() => setSelected(null)} backLabel={fr ? "Retour aux analyses" : "Back to analyses"} />
        </main>
      </DashboardChrome>
    );
  }

  const filters: { key: SportFilter; label: string }[] = [
    { key: "all", label: fr ? "Tous" : "All" },
    { key: "football", label: "Football" },
    { key: "basketball", label: "Basketball" },
    { key: "tennis", label: "Tennis" },
  ];

  return (
    <DashboardChrome title={fr ? "Mes analyses Sport" : "My sport analyses"}>
      <main className={styles.page}>
        <section className={styles.hero}>
          <div>
            <span className={styles.eyebrow}><Trophy /> {fr ? "HISTORIQUE SPORT" : "SPORT HISTORY"}</span>
            <h1>{fr ? "Mes analyses Sport" : "My sport analyses"}</h1>
            <p>{fr ? "Retrouvez, filtrez et consultez toutes vos analyses sportives." : "Find, filter and review all your sport analyses."}</p>
          </div>
          <Link href="/dashboard/sports" className={styles.primaryButton}><Plus />{fr ? "Nouvelle analyse" : "New analysis"}<ArrowRight /></Link>
        </section>

        <section className={styles.stats} aria-label={fr ? "Statistiques" : "Statistics"}>
          {[
            { label: fr ? "Analyses totales" : "Total analyses", value: counts.all, Icon: BarChart3, tone: "red" },
            { label: "Football", value: counts.football, Icon: Trophy, tone: "green" },
            { label: "Basketball", value: counts.basketball, Icon: Target, tone: "orange" },
            { label: "Tennis", value: counts.tennis, Icon: ShieldCheck, tone: "blue" },
          ].map(({ label, value, Icon, tone }, index) => (
            <article key={label} className={styles.statCard} style={{ "--delay": `${220 + index * 60}ms` } as React.CSSProperties}>
              <span className={`${styles.statIcon} ${styles[tone]}`}><Icon /></span>
              <div><strong><Counter value={value} /></strong><small>{label}</small></div>
            </article>
          ))}
        </section>

        <section className={styles.filters}>
          <label className={styles.search}><Search /><input value={query} onChange={e => setQuery(e.target.value)} placeholder={fr ? "Rechercher une équipe, un joueur..." : "Search a team, a player..."} /></label>
          <div className={styles.sportFilters}>
            {filters.map(item => <button key={item.key} className={sport === item.key ? styles.filterActive : ""} onClick={() => setSport(item.key)}>{item.label}</button>)}
          </div>
          <button className={styles.selectButton}>{fr ? "Plus récents" : "Most recent"}<ChevronDown /></button>
          <div className={styles.viewToggle}>
            <button aria-label="Grille" className={view === "grid" ? styles.viewActive : ""} onClick={() => setView("grid")}><Grid2X2 /></button>
            <button aria-label="Liste" className={view === "list" ? styles.viewActive : ""} onClick={() => setView("list")}><List /></button>
          </div>
        </section>

        <div className={styles.contentGrid}>
          <section className={styles.historyPanel}>
            <div className={styles.panelHeading}><div><h2>{fr ? "Toutes les analyses" : "All analyses"}</h2><p>{filtered.length} {fr ? "résultat(s)" : "result(s)"}</p></div></div>
            {analyses.length === 0 ? (
              <div className={styles.empty}>
                <span><FolderOpen /></span>
                <h3>{fr ? "Aucune analyse pour le moment" : "No analyses yet"}</h3>
                <p>{fr ? "Lancez votre première analyse sportive. Elle apparaîtra automatiquement ici." : "Start your first sport analysis. It will automatically appear here."}</p>
                <Link href="/dashboard/sports" className={styles.primaryButton}><Plus />{fr ? "Créer une analyse" : "Create an analysis"}<ArrowRight /></Link>
              </div>
            ) : filtered.length === 0 ? (
              <div className={styles.empty}><span><Search /></span><h3>{fr ? "Aucune analyse ne correspond à vos filtres." : "No analysis matches your filters."}</h3><button className={styles.secondaryButton} onClick={() => { setSport("all"); setQuery(""); }}>{fr ? "Réinitialiser les filtres" : "Reset filters"}</button></div>
            ) : (
              <div className={view === "grid" ? styles.analysisGrid : styles.analysisList}>
                {filtered.map((analysis, index) => (
                  <button key={analysis.id} className={styles.analysisCard} style={{ "--delay": `${index * 60}ms` } as React.CSSProperties} onClick={() => setSelected(analysis)}>
                    <div className={styles.cardTop}><span>{analysis.sport}</span><b>{analysis.confidence}</b></div>
                    <h3>{analysis.participants}</h3>
                    <p>{analysis.competition || (fr ? "Compétition" : "Competition")}</p>
                    <div className={styles.cardMeta}><span>{readableDate(analysis.matchDate, locale)}</span><span>{fr ? "Confiance" : "Confidence"} {analysis.aiProbability}%</span></div>
                    <div className={styles.cardAction}>{fr ? "Voir le détail" : "View details"}<ArrowRight /></div>
                  </button>
                ))}
              </div>
            )}
          </section>

          <aside className={styles.sidePanels}>
            <section><h3><Search />{fr ? "Filtres enregistrés" : "Saved filters"}</h3><p>{fr ? "Retrouvez plus vite vos analyses favorites." : "Find your favorite analyses faster."}</p><button className={styles.sideAction}>{fr ? "Créer un filtre" : "Create a filter"}<Plus /></button></section>
            <section><h3><FileDown />{fr ? "Exporter et partager" : "Export and share"}</h3><p>{fr ? "Sélectionnez une analyse pour activer ces actions." : "Select an analysis to enable these actions."}</p><div className={styles.disabledActions}><button disabled><FileDown />PDF</button><button disabled><Share2 />{fr ? "Partager" : "Share"}</button></div></section>
            <section className={styles.coach}><span><BrainCircuit /></span><h3>Coach IA</h3><p>{fr ? "Approfondissez vos résultats et posez vos questions au Coach." : "Explore your results and ask the Coach your questions."}</p><Link href="/dashboard/coach">{fr ? "Ouvrir le Coach" : "Open Coach"}<ArrowRight /></Link></section>
          </aside>
        </div>

        <section className={styles.benefits}>
          {[{ Icon: Lock, label: fr ? "Privé et sécurisé" : "Private and secure" }, { Icon: Check, label: fr ? "Historique automatique" : "Automatic history" }, { Icon: BarChart3, label: fr ? "Données toujours disponibles" : "Always available data" }].map(({ Icon, label }, index) => <div key={label} style={{ "--delay": `${index * 70}ms` } as React.CSSProperties}><Icon /><span>{label}</span></div>)}
        </section>
        <p className={styles.privacy}><Info />{fr ? "Vos analyses sont personnelles et accessibles uniquement depuis votre compte." : "Your analyses are personal and only accessible from your account."}</p>
      </main>
    </DashboardChrome>
  );
}
