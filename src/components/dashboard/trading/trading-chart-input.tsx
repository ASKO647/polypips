"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  ArrowRight, BarChart3, Check, ChevronDown, Clock3, FileChartColumn,
  ImageIcon, Info, LineChart, ListChecks, Lock, ShieldAlert, Sparkles, Target,
  TrendingUp, TriangleAlert, Upload, X,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { getTradingDisclaimer } from "@/lib/data/trading-analysis";
import type { AnalysisDepth } from "@/lib/data/deep-analysis";
import styles from "./trading-analysis.module.css";

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(((reader.result as string).split(",")[1]) ?? "");
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function TradingChartInput({ errorMessage, file, onFileChange, onAnalyze, creditBalance }: {
  errorMessage: React.ReactNode | null;
  file: File | null;
  onFileChange: (file: File | null) => void;
  onAnalyze: (request: { imageBase64: string; imageMediaType: string }, depth: AnalysisDepth) => void;
  creditBalance: number;
}) {
  const locale = useLocale();
  const fr = locale === "fr";
  const tTrading = useTranslations("Trading");
  const [dragOver, setDragOver] = useState(false);
  const [depth, setDepth] = useState<AnalysisDepth>("deep");
  const [preparing, setPreparing] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [context, setContext] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!file) return setPreview(null);
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const chooseFile = (candidate?: File) => {
    if (!candidate) return;
    if (!candidate.type.startsWith("image/")) return;
    onFileChange(candidate);
  };

  const submit = async () => {
    if (!file || preparing) return;
    setPreparing(true);
    try {
      const imageBase64 = await fileToBase64(file);
      onAnalyze({ imageBase64, imageMediaType: file.type || "image/png" }, depth);
    } finally {
      setPreparing(false);
    }
  };

  return (
    <main className={styles.page}>
      <header className={styles.hero}>
        <span><BarChart3 /></span>
        <div><h1>{fr ? "Analyse IA Trading" : "Trading AI Analysis"}</h1><p>{fr ? "Importez un graphique et obtenez une lecture structurée de la tendance, des niveaux clés et des scénarios." : "Import a chart and get a structured reading of its trend, key levels and scenarios."}</p></div>
        <div className={styles.quota}>◔ <b>0/10</b> {fr ? "analyses aujourd’hui" : "analyses today"}</div>
        <Link href="/dashboard/trading/mes-analyses">{fr ? "Voir mes analyses" : "My analyses"}<ArrowRight /></Link>
      </header>

      <div className={styles.layout}>
        <section className={styles.mainCard}>
          <div className={styles.steps}><div className={styles.stepOn}><b>1</b><span>{fr ? "Importer" : "Import"}</span></div><i /><div><b>2</b><span>{fr ? "Configurer" : "Configure"}</span></div><i /><div><b>3</b><span>{fr ? "Résultat" : "Result"}</span></div></div>

          {errorMessage && <div className={styles.error}><TriangleAlert />{errorMessage}</div>}

          <div className={styles.selects}>
            <label><b>{fr ? "Actif" : "Asset"}</b><span><BarChart3 />{fr ? "Ex. BTC/USDT" : "E.g. BTC/USDT"}<ChevronDown /></span></label>
            <label><b>{fr ? "Unité de temps" : "Timeframe"}</b><span><Clock3 />{fr ? "Ex. 4 h" : "E.g. 4h"}<ChevronDown /></span></label>
            <label><b>{fr ? "Marché" : "Market"}</b><span><LineChart />Crypto<ChevronDown /></span></label>
          </div>

          <div
            className={`${styles.dropzone} ${dragOver ? styles.dragging : ""} ${preview ? styles.hasPreview : ""}`}
            role="button" tabIndex={0}
            onClick={() => inputRef.current?.click()}
            onKeyDown={event => { if (event.key === "Enter" || event.key === " ") inputRef.current?.click(); }}
            onDragOver={event => { event.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={event => { event.preventDefault(); setDragOver(false); chooseFile(event.dataTransfer.files?.[0]); }}
          >
            <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={event => chooseFile(event.target.files?.[0])} hidden />
            {preview ? <>
              <img src={preview} alt={fr ? "Aperçu du graphique importé" : "Imported chart preview"} />
              <div className={styles.fileBadge}><Check />{file?.name}<button onClick={event => { event.stopPropagation(); onFileChange(null); if (inputRef.current) inputRef.current.value = ""; }} aria-label={fr ? "Supprimer" : "Remove"}><X /></button></div>
            </> : <>
              <div className={styles.candles}><i /><i /><i /><i /></div>
              <span className={styles.uploadIcon}><Upload /></span>
              <h2>{fr ? "Déposez une capture de votre graphique" : "Drop a screenshot of your chart"}</h2>
              <p>TradingView {fr ? "ou toute autre plateforme" : "or any other platform"} · PNG, JPG ou WEBP</p>
              <button><ImageIcon />{fr ? "Choisir une image" : "Choose an image"}</button>
              <small>{fr ? "Veillez à afficher clairement les bougies, le prix et l’unité de temps." : "Make sure candles, price and timeframe are clearly visible."}</small>
            </>}
          </div>

          <label className={styles.context}><b><FileChartColumn />{fr ? "Contexte facultatif" : "Optional context"}</b><textarea maxLength={500} value={context} onChange={event => setContext(event.target.value)} placeholder={fr ? "Ajoutez votre stratégie, vos niveaux ou une question précise..." : "Add your strategy, levels or a specific question..."} /><small>{context.length}/500</small></label>

          <div className={styles.depth}><h3><BarChart3 />{fr ? "Profondeur de l’analyse" : "Analysis depth"}</h3><div><button className={depth === "standard" ? styles.depthOn : ""} onClick={() => setDepth("standard")}><i /><span><b>{fr ? "Rapide" : "Quick"}</b><small>{fr ? "Tendance et niveaux essentiels" : "Essential trend and levels"}</small></span></button><button className={depth === "deep" ? styles.depthOn : ""} onClick={() => setDepth("deep")}><i /><span><b>{fr ? "Approfondie" : "Deep"}</b><small>{fr ? "Structure, scénarios et gestion du risque" : "Structure, scenarios and risk management"}</small></span><em>◉ 1 {fr ? "crédit" : "credit"} · {creditBalance}</em></button></div></div>

          <button className={styles.analyze} disabled={!file || preparing} onClick={submit}><Sparkles />{preparing ? (fr ? "Préparation…" : "Preparing…") : (fr ? "Analyser le graphique" : "Analyze chart")}<ArrowRight /></button>
          <p className={styles.private}><Lock />{fr ? "Votre capture est utilisée uniquement pour cette analyse." : "Your screenshot is only used for this analysis."}</p>
        </section>

        <aside className={styles.side}>
          <section><h2><ListChecks />{fr ? "L’analyse comprendra" : "Your analysis includes"}</h2><ul>{([[TrendingUp, fr ? "Tendance dominante" : "Dominant trend"], [BarChart3, fr ? "Supports et résistances" : "Support and resistance"], [LineChart, fr ? "Scénarios haussier et baissier" : "Bullish and bearish scenarios"], [ShieldAlert, fr ? "Zone d’invalidation" : "Invalidation zone"], [TriangleAlert, fr ? "Risques à surveiller" : "Risks to watch"], [Target, fr ? "TP/SL indicatifs" : "Indicative TP/SL"]] as const).map(([Icon, label], index) => <li key={label} style={{ "--delay": `${index * 60}ms` } as React.CSSProperties}><Icon /><span>{label}</span></li>)}</ul></section>
          <section className={styles.recent}><div><h2><Clock3 />{fr ? "Analyses récentes" : "Recent analyses"}</h2><Link href="/dashboard/trading/mes-analyses">{fr ? "Voir tout l’historique" : "View history"}<ArrowRight /></Link></div><span><FileChartColumn /></span><b>{fr ? "Aucune analyse récente" : "No recent analysis"}</b><p>{fr ? "Vos analyses apparaîtront ici une fois que vous aurez importé un graphique." : "Your analyses will appear here after importing a chart."}</p></section>
          <p className={styles.disclaimer}><ShieldAlert />{getTradingDisclaimer(tTrading)}</p>
        </aside>
      </div>

      <section className={styles.tips}><h2><Info />{fr ? "Comment obtenir une meilleure analyse ?" : "How to get a better analysis"}</h2><div>{([[ImageIcon, fr ? "Capture nette" : "Clear screenshot", fr ? "Une image claire avec les bougies, le prix et les annotations si possible." : "A clear image with candles, price and annotations."], [Clock3, fr ? "Actif et timeframe visibles" : "Visible asset and timeframe", fr ? "Indiquez l’actif et l’unité de temps affichés sur votre graphique." : "Show the asset and timeframe on the chart."], [FileChartColumn, fr ? "Ajoutez votre contexte" : "Add your context", fr ? "Partagez votre stratégie, vos niveaux ou une question précise." : "Share your strategy, levels or a specific question."]] as const).map(([Icon, title, text], index) => <article key={title} style={{ "--delay": `${index * 70}ms` } as React.CSSProperties}><Icon /><p><b>{title}</b><span>{text}</span></p></article>)}</div></section>
    </main>
  );
}
