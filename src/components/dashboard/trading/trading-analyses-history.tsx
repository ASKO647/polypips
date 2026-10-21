"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ArrowRight, BarChart3, Bitcoin, Check, ChevronDown, FileDown, FileSearch, Grid2X2, Info, LineChart, List, Plus, Search, Share2, SlidersHorizontal, Target, TrendingDown, TrendingUp } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { DashboardChrome } from "@/components/dashboard/shared/dashboard-chrome";
import { TradingAnalysisResult } from "@/components/dashboard/trading/trading-analysis-result";
import { getConfidenceLabel, getRecommendationLabel, type TradingChartAnalysis } from "@/lib/data/trading-analysis";
import styles from "./trading-history.module.css";

type MarketFilter = "all" | "crypto" | "forex" | "indices" | "actions";
type TrendFilter = "all" | TradingChartAnalysis["recommendation"];

function Counter({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (!value) return setDisplay(0);
    const start = performance.now(); let frame = 0;
    const tick = (now: number) => { const progress = Math.min((now - start) / 550, 1); setDisplay(Math.round(value * progress)); if (progress < 1) frame = requestAnimationFrame(tick); };
    frame = requestAnimationFrame(tick); return () => cancelAnimationFrame(frame);
  }, [value]);
  return <>{display}</>;
}

function marketOf(analysis: TradingChartAnalysis): Exclude<MarketFilter, "all"> {
  const value = (analysis.instrument ?? "").toUpperCase();
  if (/BTC|ETH|SOL|BNB|XRP|DOGE|ADA|CRYPTO/.test(value)) return "crypto";
  if (/SPX|NAS|DAX|CAC|DJI|INDEX|US30|US100/.test(value)) return "indices";
  if (/AAPL|TSLA|NVDA|AMZN|META|ACTION|STOCK/.test(value)) return "actions";
  return "forex";
}

function MiniChart({ direction }: { direction: TradingChartAnalysis["recommendation"] }) {
  return <div className={styles.miniChart} aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /><i /><i /><span className={direction === "Vendre" ? styles.downLine : direction === "Acheter" ? styles.upLine : styles.flatLine} /></div>;
}

export function TradingAnalysesHistory({ analyses }: { analyses: TradingChartAnalysis[] }) {
  const locale = useLocale(); const fr = locale === "fr"; const tTrading = useTranslations("Trading");
  const [selected, setSelected] = useState<TradingChartAnalysis | null>(null);
  const [market, setMarket] = useState<MarketFilter>("all"); const [trend, setTrend] = useState<TrendFilter>("all");
  const [query, setQuery] = useState(""); const [debouncedQuery, setDebouncedQuery] = useState(""); const [view, setView] = useState<"grid" | "list">("grid");
  useEffect(() => { const timer = window.setTimeout(() => setDebouncedQuery(query), 250); return () => window.clearTimeout(timer); }, [query]);

  const counts = useMemo(() => ({ total: analyses.length, crypto: analyses.filter(a => marketOf(a) === "crypto").length, forex: analyses.filter(a => ["forex", "indices"].includes(marketOf(a))).length, followed: new Set(analyses.map(a => a.instrument).filter(Boolean)).size }), [analyses]);
  const filtered = useMemo(() => { const needle = debouncedQuery.trim().toLocaleLowerCase(locale); return analyses.filter(a => (market === "all" || marketOf(a) === market) && (trend === "all" || a.recommendation === trend) && (!needle || `${a.instrument ?? ""} ${a.timeframe ?? ""} ${a.trendAnalysis}`.toLocaleLowerCase(locale).includes(needle))); }, [analyses, market, trend, debouncedQuery, locale]);

  if (selected) return <DashboardChrome title={fr ? "Mes analyses Trading" : "My trading analyses"}><main className={styles.resultPage}><TradingAnalysisResult analysis={selected} onBack={() => setSelected(null)} backLabel={fr ? "Retour aux analyses" : "Back to analyses"} /></main></DashboardChrome>;

  const marketFilters: { key: MarketFilter; label: string }[] = [{ key: "all", label: fr ? "Toutes" : "All" }, { key: "crypto", label: "Crypto" }, { key: "forex", label: "Forex" }, { key: "indices", label: "Indices" }, { key: "actions", label: fr ? "Actions" : "Stocks" }];
  return <DashboardChrome title={fr ? "Mes analyses Trading" : "My trading analyses"}><main className={styles.page}>
    <section className={styles.hero}><div className={styles.heroCopy}><span className={styles.heroIcon}><BarChart3 /></span><div><h1>{fr ? "Mes analyses Trading" : "My trading analyses"}</h1><p>{fr ? "Retrouvez, filtrez et comparez toutes vos analyses de graphiques." : "Find, filter and compare all your chart analyses."}</p></div></div><div className={styles.heroActions}><span><BarChart3 />{counts.total} {fr ? "analyse ce mois-ci" : "analysis this month"}</span><Link href="/dashboard/trading"><Plus />{fr ? "Nouvelle analyse" : "New analysis"}</Link></div></section>
    <section className={styles.stats} aria-label={fr ? "Statistiques" : "Statistics"}>{[
      { label: fr ? "Analyses réalisées" : "Completed analyses", value: counts.total, Icon: BarChart3, tone: "red" }, { label: "Crypto", value: counts.crypto, Icon: Bitcoin, tone: "orange" }, { label: "Forex & indices", value: counts.forex, Icon: LineChart, tone: "blue" }, { label: fr ? "Actifs suivis" : "Tracked assets", value: counts.followed, Icon: Target, tone: "purple" },
    ].map(({ label, value, Icon, tone }, index) => <article key={label} className={styles.statCard} style={{ "--delay": `${160 + index * 60}ms` } as React.CSSProperties}><span className={`${styles.statIcon} ${styles[tone]}`}><Icon /></span><div><small>{label}</small><strong><Counter value={value} /></strong></div></article>)}</section>
    <section className={styles.filters}><label className={styles.search}><Search /><input value={query} onChange={e => setQuery(e.target.value)} placeholder={fr ? "Rechercher un actif ou une analyse" : "Search an asset or analysis"} /></label><div className={styles.marketFilters}>{marketFilters.map(item => <button key={item.key} className={market === item.key ? styles.filterActive : ""} onClick={() => setMarket(item.key)}>{item.label}</button>)}</div><label className={styles.select}><span>{fr ? "Tendance" : "Trend"}</span><select value={trend} onChange={e => setTrend(e.target.value as TrendFilter)}><option value="all">{fr ? "toutes" : "all"}</option><option value="Acheter">{getRecommendationLabel(tTrading, "Acheter")}</option><option value="Vendre">{getRecommendationLabel(tTrading, "Vendre")}</option><option value="Attendre">{getRecommendationLabel(tTrading, "Attendre")}</option></select><ChevronDown /></label><button className={styles.selectButton}>{fr ? "Période : toutes" : "Period: all"}<ChevronDown /></button><button className={styles.selectButton}>{fr ? "Unité : toutes" : "Timeframe: all"}<ChevronDown /></button><div className={styles.viewToggle}><button aria-label="Grille" className={view === "grid" ? styles.viewActive : ""} onClick={() => setView("grid")}><Grid2X2 /></button><button aria-label="Liste" className={view === "list" ? styles.viewActive : ""} onClick={() => setView("list")}><List /></button></div></section>
    <div className={styles.contentGrid}><section className={styles.historyPanel}>{analyses.length === 0 ? <div className={styles.empty}><span className={styles.emptyIcon}><BarChart3 /><FileSearch /></span><h2>{fr ? "Aucune analyse Trading pour le moment" : "No trading analysis yet"}</h2><p>{fr ? "Importez la capture d’un graphique pour identifier sa tendance, ses niveaux clés, ses scénarios et ses risques." : "Upload a chart screenshot to identify its trend, key levels, scenarios and risks."}</p><Link href="/dashboard/trading" className={styles.primaryButton}><Plus />{fr ? "Créer ma première analyse" : "Create my first analysis"}</Link><Link href="/dashboard/trading/selection" className={styles.textLink}>{fr ? "Découvrir la sélection du jour" : "Discover today’s selection"}<ArrowRight /></Link><div className={styles.benefits}><h3>{fr ? "Après votre première analyse, vous pourrez :" : "After your first analysis, you can:"}</h3><div>{[
      { Icon: BarChart3, title: fr ? "Comparer vos graphiques" : "Compare charts", text: fr ? "Visualisez et comparez facilement plusieurs analyses sur vos actifs favoris." : "Easily compare analyses for your favorite assets." }, { Icon: Target, title: fr ? "Retrouver les niveaux clés" : "Find key levels", text: fr ? "Retrouvez vos supports, résistances et zones clés identifiés par l’IA." : "Find AI-identified support and resistance levels." },
    ].map(({ Icon, title, text }, index) => <article key={title} style={{ "--delay": `${index * 70}ms` } as React.CSSProperties}><span><Icon /></span><div><b>{title}</b><p>{text}</p></div></article>)}</div></div></div> : filtered.length === 0 ? <div className={styles.empty}><span className={styles.emptyIcon}><Search /></span><h2>{fr ? "Aucune analyse ne correspond à vos filtres." : "No analysis matches your filters."}</h2><button className={styles.secondaryButton} onClick={() => { setMarket("all"); setTrend("all"); setQuery(""); }}>{fr ? "Réinitialiser les filtres" : "Reset filters"}</button></div> : <div className={view === "grid" ? styles.analysisGrid : styles.analysisList}>{filtered.map((analysis, index) => <button key={analysis.id} className={styles.analysisCard} style={{ "--delay": `${index * 60}ms` } as React.CSSProperties} onClick={() => setSelected(analysis)}><div className={styles.cardTop}><div><span>{marketOf(analysis)}</span><h3>{analysis.instrument || (fr ? "Actif non identifié" : "Unknown asset")}</h3><p>{analysis.timeframe || (fr ? "Unité non détectée" : "Unknown timeframe")}</p></div><b className={styles[analysis.recommendation === "Acheter" ? "buy" : analysis.recommendation === "Vendre" ? "sell" : "wait"]}>{analysis.recommendation === "Acheter" ? <TrendingUp /> : analysis.recommendation === "Vendre" ? <TrendingDown /> : <SlidersHorizontal />}{getRecommendationLabel(tTrading, analysis.recommendation)}</b></div><MiniChart direction={analysis.recommendation} /><div className={styles.levels}>{analysis.keyLevels.slice(0, 2).map(level => <span key={`${level.type}-${level.level}`}><small>{level.type}</small>{level.level}</span>)}{analysis.keyLevels.length === 0 && <span><small>{fr ? "Confiance" : "Confidence"}</small>{getConfidenceLabel(tTrading, analysis.confidence)}</span>}</div><div className={styles.cardBottom}><span>{analysis.analyzedAt}</span><strong>{fr ? "Voir le détail" : "View details"}<ArrowRight /></strong></div></button>)}</div>}</section>
      <aside className={styles.sidePanels}><section><h3><Target />{fr ? "Filtres enregistrés" : "Saved filters"}</h3><div className={styles.sideEmpty}><Target /><b>{fr ? "Aucun filtre enregistré" : "No saved filter"}</b><p>{fr ? "Enregistrez vos filtres pour les retrouver rapidement." : "Save filters to find them quickly."}</p></div><button className={styles.outlineButton}>{fr ? "Créer un filtre" : "Create filter"}</button></section><section><h3><Share2 />{fr ? "Export & comparaison" : "Export & comparison"}</h3><div className={styles.disabledActions}><button disabled><FileDown />{fr ? "Exporter en PDF" : "Export PDF"}</button><button disabled><LineChart />{fr ? "Comparer des analyses" : "Compare analyses"}</button><button disabled><Share2 />{fr ? "Partager une analyse" : "Share analysis"}</button></div><p className={styles.hint}><Info />{fr ? "Disponible après votre première analyse." : "Available after your first analysis."}</p></section></aside></div>
    <p className={styles.privacy}><Check />{fr ? "Vos captures et analyses sont privées et accessibles uniquement depuis votre compte." : "Your screenshots and analyses are private and only accessible from your account."}</p>
  </main></DashboardChrome>;
}
