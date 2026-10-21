"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  ArrowDownRight, ArrowRight, ArrowUpRight, BarChart3, Bookmark, Check,
  ChevronDown, Clock3, Grid2X2, LineChart, List, Lock, PieChart, RefreshCw,
  Search, ShieldAlert, Sparkles, Target, Trophy,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { DashboardChrome } from "@/components/dashboard/shared/dashboard-chrome";
import { TradingAnalysisResult } from "@/components/dashboard/trading/trading-analysis-result";
import { OnDemandScanButton } from "@/components/dashboard/on-demand-scan-button";
import type { TradingChartAnalysis } from "@/lib/data/trading-analysis";
import { SYNC_TRADING_SELECTION_INTERVAL_MINUTES } from "@/lib/data/trading-analysis";
import type { PlanId } from "@/lib/stripe/plans";
import styles from "./trading-selection.module.css";

type Market = "all" | "crypto" | "forex" | "indices" | "stocks";

function marketOf(instrument: string | null): Market {
  const value = (instrument || "").toUpperCase();
  if (/BTC|ETH|SOL|USDT|USD[T|C]|CRYPTO/.test(value)) return "crypto";
  if (/EUR|GBP|JPY|CHF|AUD|CAD|NZD/.test(value)) return "forex";
  if (/NASDAQ|SPX|S&P|DAX|CAC|DOW|INDEX/.test(value)) return "indices";
  return "stocks";
}

function assetSymbol(instrument: string | null) {
  const value = (instrument || "?").toUpperCase();
  if (value.includes("BTC")) return "₿";
  if (value.includes("ETH")) return "◆";
  if (value.includes("GOLD") || value.includes("XAU")) return "◫";
  if (value.includes("EUR")) return "€";
  return value.slice(0, 1);
}

function CandleChart({ compact = false, direction = 1 }: { compact?: boolean; direction?: number }) {
  const candles = Array.from({ length: compact ? 23 : 52 }, (_, index) => {
    const wave = Math.sin(index * .65) * (compact ? 9 : 17);
    const slope = direction * index * (compact ? .45 : .7);
    const open = 38 + wave + slope;
    const close = open + Math.sin(index * 1.7) * 8;
    return { open, close, high: Math.max(open, close) + 5, low: Math.min(open, close) - 5 };
  });
  return <div className={`${styles.chart} ${compact ? styles.miniChart : ""}`}><div className={styles.chartGrid} />{candles.map((c, index) => <i key={index} className={c.close >= c.open ? styles.up : styles.down} style={{ left: `${(index / candles.length) * 96 + 2}%`, bottom: `${Math.min(c.low, 82)}%`, height: `${Math.max(c.high - c.low, 10)}%`, "--body-bottom": `${((Math.min(c.open, c.close) - c.low) / (c.high - c.low)) * 100}%`, "--body-height": `${Math.max((Math.abs(c.close - c.open) / (c.high - c.low)) * 100, 15)}%`, "--delay": `${index * 16}ms` } as React.CSSProperties} />)}{!compact && <><span className={styles.resistance}>Résistance</span><span className={styles.support}>Support</span></>}</div>;
}

export function TradingSelectionFlow({ analyses, hasActiveSubscription, currentPlan, lastSyncedAt }: {
  analyses: TradingChartAnalysis[];
  hasActiveSubscription: boolean;
  currentPlan: PlanId | null;
  lastSyncedAt: string | null;
}) {
  const locale = useLocale();
  const fr = locale === "fr";
  const t = useTranslations("Trading.Selection");
  const [selected, setSelected] = useState<TradingChartAnalysis | null>(null);
  const [market, setMarket] = useState<Market>("all");
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [followed, setFollowed] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState(false);

  const filtered = useMemo(() => analyses.filter(item => {
    const matchMarket = market === "all" || marketOf(item.instrument) === market;
    const matchSearch = !query.trim() || (item.instrument || "").toLowerCase().includes(query.trim().toLowerCase());
    return matchMarket && matchSearch;
  }), [analyses, market, query]);

  const follow = (id: string) => {
    setFollowed(current => { const next = new Set(current); next.has(id) ? next.delete(id) : next.add(id); return next; });
    setToast(true);
    window.setTimeout(() => setToast(false), 3000);
  };

  if (selected) return <DashboardChrome title={fr ? "Sélection du jour" : "Today’s selection"}><main className={styles.resultPage}><TradingAnalysisResult analysis={selected} onBack={() => setSelected(null)} backLabel={t("backToListLabel")} locked={!hasActiveSubscription} /></main></DashboardChrome>;

  const featured = filtered[0];
  const remaining = filtered.slice(1);
  const nextRefresh = (() => {
    const base = lastSyncedAt ? new Date(lastSyncedAt).getTime() : Date.now();
    const minutes = Math.max(0, Math.floor((base + SYNC_TRADING_SELECTION_INTERVAL_MINUTES * 60000 - Date.now()) / 60000));
    return `${Math.floor(minutes / 60)} h ${minutes % 60} min`;
  })();
  const marketLabels: { key: Market; label: string }[] = [{ key: "all", label: fr ? "Tous" : "All" }, { key: "crypto", label: "Crypto" }, { key: "forex", label: "Forex" }, { key: "indices", label: "Indices" }, { key: "stocks", label: fr ? "Actions" : "Stocks" }];

  return <DashboardChrome title={fr ? "Sélection du jour" : "Today’s selection"}>
    <main className={styles.page}>
      {toast && <div className={styles.toast}><Check />{fr ? "Vous serez averti des changements importants." : "You will be notified of important changes."}</div>}
      <header className={styles.hero}><span><Trophy /></span><div><h1>{fr ? "Sélection du jour" : "Today’s selection"}</h1><p>{fr ? "Les actifs et configurations techniques à surveiller selon les données disponibles." : "Assets and technical setups to watch based on available data."}</p></div><em><Clock3 />{fr ? "Actualisé récemment" : "Recently updated"}</em><div className={styles.scan}><OnDemandScanButton feature="trading" currentPlan={currentPlan} /></div></header>

      <section className={styles.filters}><label><Search /><input value={query} onChange={event => setQuery(event.target.value)} placeholder={fr ? "Rechercher un actif" : "Search an asset"} /></label><div className={styles.marketFilters}>{marketLabels.map(item => <button key={item.key} onClick={() => setMarket(item.key)} className={market === item.key ? styles.activeFilter : ""}>{item.label}</button>)}</div><button className={styles.select}>Tendance : {fr ? "toutes" : "all"}<ChevronDown /></button><button className={styles.select}>{fr ? "Risque : tous" : "Risk: all"}<ChevronDown /></button><button className={styles.select}>{fr ? "Unité : toutes" : "Timeframe: all"}<ChevronDown /></button><div className={styles.views}><button onClick={() => setView("grid")} className={view === "grid" ? styles.activeView : ""}><Grid2X2 /></button><button onClick={() => setView("list")} className={view === "list" ? styles.activeView : ""}><List /></button></div></section>
      <p className={styles.notice}><ShieldAlert />{fr ? "Cette sélection est informative et ne constitue pas un conseil financier." : "This selection is informational and is not financial advice."}</p>

      {!featured ? <section className={styles.empty}><LineChart /><h2>{t("emptyTitle")}</h2><p>{t("emptyDescription")}</p></section> : <>
        <section className={styles.featured}>
          <div className={styles.featuredChart}><span className={styles.watch}><BarChart3 />{fr ? "Configuration à surveiller" : "Setup to watch"}</span><div className={styles.asset}><b>{assetSymbol(featured.instrument)}</b><div><h2>{featured.instrument || (fr ? "Actif détecté" : "Detected asset")}</h2><p>{marketOf(featured.instrument)} · {featured.timeframe || "—"}</p></div><small><i />{fr ? "Données mises à jour" : "Data updated"}</small></div><CandleChart direction={featured.recommendation === "Vendre" ? -1 : 1} /></div>
          <div className={styles.reading}><h2><BarChart3 />Lecture Polypips</h2><strong className={featured.recommendation === "Vendre" ? styles.bearish : styles.bullish}>{featured.recommendation === "Vendre" ? <ArrowDownRight /> : <ArrowUpRight />}{featured.recommendation} · {featured.confidence}</strong><dl><div><dt>Structure :</dt><dd>{featured.trendAnalysis}</dd></div><div><dt>{fr ? "Zone clé" : "Key zone"} :</dt><dd>{featured.keyLevels[0]?.level || "—"}</dd></div><div><dt>Momentum :</dt><dd>{fr ? "À confirmer" : "To confirm"}</dd></div><div><dt>{fr ? "Risque" : "Risk"} :</dt><dd><mark>{featured.confidence === "Élevée" ? (fr ? "Faible" : "Low") : (fr ? "Moyen" : "Medium")}</mark></dd></div></dl><div><button onClick={() => setSelected(featured)}>{fr ? "Voir l’analyse" : "View analysis"}<ArrowRight /></button><button className={followed.has(featured.id) ? styles.followed : ""} onClick={() => follow(featured.id)}><Bookmark />{followed.has(featured.id) ? (fr ? "Suivi" : "Following") : (fr ? "Suivre" : "Follow")}</button></div></div>
        </section>

        <section className={`${styles.cards} ${view === "list" ? styles.list : ""}`}>{remaining.map((item, index) => <article key={item.id} style={{ "--delay": `${index * 60}ms` } as React.CSSProperties}><header><b>{assetSymbol(item.instrument)}</b><div><h3>{item.instrument || "—"}</h3><p>{marketOf(item.instrument)} · {item.timeframe || "—"}</p></div><button className={followed.has(item.id) ? styles.followed : ""} onClick={() => follow(item.id)}><Bookmark /></button></header><CandleChart compact direction={item.recommendation === "Vendre" ? -1 : 1} /><strong className={item.recommendation === "Vendre" ? styles.bearishTag : styles.bullishTag}>{item.recommendation === "Vendre" ? <ArrowDownRight /> : <ArrowUpRight />}{item.recommendation} · {item.confidence}</strong><p>{fr ? "Risque" : "Risk"} : <b>{item.confidence === "Élevée" ? (fr ? "Faible" : "Low") : (fr ? "Moyen" : "Medium")}</b></p><p>{fr ? "Zone clé" : "Key zone"} : <b>{item.keyLevels[0]?.level || "—"}</b></p><button className={styles.analyzeCard} onClick={() => setSelected(item)}>{fr ? "Analyser" : "Analyze"}<ArrowRight /></button></article>)}</section>
      </>}

      <footer className={styles.bottom}><div><BarChart3 /><b>{analyses.length}</b><span>{fr ? "actifs sélectionnés" : "selected assets"}<small>{fr ? "Des configurations techniques à surveiller" : "Technical setups to watch"}</small></span></div><div><PieChart /><b>{new Set(analyses.map(item => marketOf(item.instrument))).size}</b><span>{fr ? "marchés" : "markets"}<small>Crypto, Forex, Indices, Actions</small></span></div><div><Clock3 /><span>{fr ? "Prochaine actualisation dans" : "Next refresh in"}<b>{nextRefresh}</b></span></div><Link href="/dashboard/trading"><Sparkles />{fr ? "Analyser un autre actif" : "Analyze another asset"}<ArrowRight /></Link></footer>
    </main>
  </DashboardChrome>;
}
