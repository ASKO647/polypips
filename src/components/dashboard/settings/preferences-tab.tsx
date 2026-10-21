"use client";

import { useEffect, useState } from "react";
import { Accessibility, BarChart3, Bot, CheckCircle2, Clock3, Database, Gauge, Globe2, Home, Keyboard, Languages, Link2, List, Moon, Palette, Percent, RotateCcw, Settings, Sun, TriangleAlert } from "lucide-react";
import { useDashboardTheme } from "@/providers/dashboard-theme-provider";
import styles from "./preferences-tab.module.css";

type ThemeChoice = "light" | "dark" | "system";
const storageKey = "polypips-ui-preferences-v1";

function Toggle({ value, label, onChange }: { value:boolean; label:string; onChange:()=>void }) {
  return <button type="button" role="switch" aria-checked={value} aria-label={label} className={`${styles.toggle} ${value ? styles.toggleOn : ""}`} onClick={onChange}><i /></button>;
}
function Segmented({ options, value, onChange }: { options:string[]; value:string; onChange:(value:string)=>void }) {
  return <div className={styles.segmented}>{options.map(option=><button type="button" className={value===option?styles.selected:""} onClick={()=>onChange(option)} key={option}>{option}</button>)}</div>;
}

export function PreferencesTab(){
  const { setTheme }=useDashboardTheme();
  const [themeChoice,setThemeChoice]=useState<ThemeChoice>("light");
  const [density,setDensity]=useState("Confortable");
  const [animations,setAnimations]=useState(true);
  const [startPage,setStartPage]=useState("Tableau de bord");
  const [favorite,setFavorite]=useState("Polymarket");
  const [resume,setResume]=useState(true);
  const [shortcuts,setShortcuts]=useState(true);
  const [risk,setRisk]=useState("Équilibré");
  const [depth,setDepth]=useState("Détaillée");
  const [probabilities,setProbabilities]=useState(true);
  const [sources,setSources]=useState(true);
  const [warnings,setWarnings]=useState(true);
  const [tone,setTone]=useState("Clair et pédagogique");
  const [length,setLength]=useState("Standard");
  const [history,setHistory]=useState(true);
  const [textSize,setTextSize]=useState(50);
  const [reduceMotion,setReduceMotion]=useState(false);
  const [contrast,setContrast]=useState(false);
  const [keyboard,setKeyboard]=useState(true);
  const [saved,setSaved]=useState(false);
  const [dirty,setDirty]=useState(false);
  const [confirmReset,setConfirmReset]=useState(false);

  useEffect(()=>{try{const raw=localStorage.getItem(storageKey);if(!raw)return;const value=JSON.parse(raw);Object.entries(value).forEach(()=>{});if(value.themeChoice)setThemeChoice(value.themeChoice);if(value.density)setDensity(value.density);if(typeof value.animations==="boolean")setAnimations(value.animations);if(value.risk)setRisk(value.risk);if(value.depth)setDepth(value.depth);if(value.tone)setTone(value.tone);if(value.length)setLength(value.length);if(typeof value.textSize==="number")setTextSize(value.textSize)}catch{}},[]);
  const change=(fn:()=>void)=>{fn();setDirty(true);setSaved(false)};
  const chooseTheme=(choice:ThemeChoice)=>change(()=>{setThemeChoice(choice);if(choice==="system")setTheme(window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");else setTheme(choice)});
  const save=()=>{localStorage.setItem(storageKey,JSON.stringify({themeChoice,density,animations,startPage,favorite,resume,shortcuts,risk,depth,probabilities,sources,warnings,tone,length,history,textSize,reduceMotion,contrast,keyboard}));setDirty(false);setSaved(true);window.setTimeout(()=>setSaved(false),3000)};
  const reset=()=>{setThemeChoice("light");setTheme("light");setDensity("Confortable");setAnimations(true);setStartPage("Tableau de bord");setFavorite("Polymarket");setResume(true);setShortcuts(true);setRisk("Équilibré");setDepth("Détaillée");setProbabilities(true);setSources(true);setWarnings(true);setTone("Clair et pédagogique");setLength("Standard");setHistory(true);setTextSize(50);setReduceMotion(false);setContrast(false);setKeyboard(true);localStorage.removeItem(storageKey);setConfirmReset(false);setSaved(true)};

  return <section className={`${styles.root} ${density==="Compacte"?styles.compact:""} ${reduceMotion?styles.reduced:""}`}>
    {saved&&<div className={styles.toast}><CheckCircle2/>Préférences enregistrées</div>}
    <button id="preferences-save-action" className={styles.hiddenAction} onClick={save}/>
    <div className={styles.grid}>
      <article className={styles.card}>
        <header><Palette/><div><h2>Apparence</h2><p>Choisissez le thème et l’aspect de l’interface.</p></div></header>
        <div className={styles.themes}>{(["light","dark","system"] as ThemeChoice[]).map((choice)=><button className={themeChoice===choice?styles.themeSelected:""} onClick={()=>chooseTheme(choice)} key={choice}><div className={`${styles.themePreview} ${styles[choice]}`}><aside/><main><i/><i/><i/></main></div><span>{choice==="light"?<Sun/>:choice==="dark"?<Moon/>:<Palette/>}{choice==="light"?"Clair":choice==="dark"?"Sombre":"Système"}</span></button>)}</div>
        <div className={styles.inline}><label>Densité de l’interface<Segmented options={["Confortable","Compacte"]} value={density} onChange={value=>change(()=>setDensity(value))}/></label><div><span>Animations de l’interface</span><Toggle value={animations} label="Animations de l’interface" onChange={()=>change(()=>setAnimations(value=>!value))}/></div></div>
      </article>

      <article className={styles.card}><header><Globe2/><div><h2>Langue et région</h2><p>Configurez votre langue, votre fuseau horaire et vos préférences régionales.</p></div></header><div className={styles.formRows}>
        <label><Languages/>Langue<select><option>Français</option><option>English</option></select></label>
        <label><Clock3/>Fuseau horaire<select><option>Europe/Paris</option><option>UTC</option></select></label>
        <label><List/>Format de date<select><option>21 octobre 2026</option><option>21/10/2026</option></select></label>
        <label><Database/>Devise<select><option>EUR (€)</option><option>USD ($)</option></select></label>
      </div></article>

      <article className={styles.card}><header><Settings/><div><h2>Expérience Polypips</h2><p>Personnalisez votre navigation et vos modules favoris.</p></div></header><div className={styles.formRows}>
        <label><Home/>Page affichée au démarrage<select value={startPage} onChange={e=>change(()=>setStartPage(e.target.value))}><option>Tableau de bord</option><option>Polymarket</option><option>Coach IA</option></select></label>
        <label><BarChart3/>Module favori<select value={favorite} onChange={e=>change(()=>setFavorite(e.target.value))}><option>Polymarket</option><option>Sport</option><option>Trading</option></select></label>
        <div><RotateCcw/><span>Reprendre ma dernière session</span><Toggle value={resume} label="Reprendre ma dernière session" onChange={()=>change(()=>setResume(v=>!v))}/></div>
        <div><Keyboard/><span>Afficher les raccourcis clavier</span><Toggle value={shortcuts} label="Afficher les raccourcis clavier" onChange={()=>change(()=>setShortcuts(v=>!v))}/></div>
      </div></article>

      <article className={styles.card}><header><Gauge/><div><h2>Préférences d’analyse</h2><p>Définissez votre profil de risque et le niveau de détail par défaut.</p></div></header><div className={styles.analysisRows}>
        <label><span>Profil de risque</span><Segmented options={["Prudent","Équilibré","Dynamique"]} value={risk} onChange={value=>change(()=>setRisk(value))}/></label>
        <label><span>Profondeur d’analyse par défaut</span><Segmented options={["Rapide","Détaillée","Experte"]} value={depth} onChange={value=>change(()=>setDepth(value))}/></label>
        <div><Percent/><span>Afficher les probabilités</span><Toggle value={probabilities} label="Afficher les probabilités" onChange={()=>change(()=>setProbabilities(v=>!v))}/></div>
        <div><Link2/><span>Afficher les sources</span><Toggle value={sources} label="Afficher les sources" onChange={()=>change(()=>setSources(v=>!v))}/></div>
        <div><TriangleAlert/><span>Afficher les avertissements de risque</span><Toggle value={warnings} label="Afficher les avertissements" onChange={()=>change(()=>setWarnings(v=>!v))}/></div>
        {risk==="Dynamique"&&<p className={styles.warning}>Le profil Dynamique augmente l’exposition au risque. Les avertissements resteront toujours visibles.</p>}
      </div></article>

      <article className={styles.card}><header><Bot/><div><h2>Coach IA</h2><p>Personnalisez le ton et le style de réponse de votre Coach IA.</p></div></header><div className={styles.formRows}>
        <label><Bot/>Ton de réponse<select value={tone} onChange={e=>change(()=>setTone(e.target.value))}><option>Clair et pédagogique</option><option>Direct et synthétique</option><option>Expert et technique</option></select></label>
        <label><List/>Longueur de réponse<Segmented options={["Courte","Standard","Détaillée"]} value={length} onChange={value=>change(()=>setLength(value))}/></label>
        <div><Database/><span>Utiliser mon historique pour personnaliser les réponses</span><Toggle value={history} label="Utiliser mon historique" onChange={()=>change(()=>setHistory(v=>!v))}/></div>
        <button className={styles.memory}>Gérer la mémoire du Coach →</button>
      </div><div className={styles.coachExample}>« {tone} · réponse {length.toLowerCase()} »</div></article>

      <article className={styles.card}><header><Accessibility/><div><h2>Accessibilité</h2><p>Adaptez l’interface à vos besoins.</p></div></header><div className={styles.accessRows}>
        <label><span>Taille du texte</span><small>A−</small><input type="range" min="0" max="100" value={textSize} onChange={e=>change(()=>setTextSize(Number(e.target.value)))}/><small>A+</small><b>{textSize<35?"Petite":textSize>65?"Grande":"Moyenne"}</b></label>
        <div><span>Réduire les animations</span><Toggle value={reduceMotion} label="Réduire les animations" onChange={()=>change(()=>setReduceMotion(v=>!v))}/></div>
        <div><span>Contraste renforcé</span><Toggle value={contrast} label="Contraste renforcé" onChange={()=>change(()=>setContrast(v=>!v))}/></div>
        <div><span>Navigation au clavier</span><Toggle value={keyboard} label="Navigation au clavier" onChange={()=>change(()=>setKeyboard(v=>!v))}/></div>
        <label><span>Taille du texte (menu)</span><select><option>Moyenne</option><option>Grande</option></select></label>
      </div></article>
    </div>
    <button className={styles.reset} onClick={()=>setConfirmReset(true)}><RotateCcw/><span><b>Réinitialiser toutes les préférences</b><small>Cette action ne supprime aucune donnée de votre compte.</small></span></button>
    <div className={styles.mobileSave}><button disabled={!dirty} onClick={save}>Enregistrer les préférences</button></div>
    {confirmReset&&<div className={styles.overlay}><div className={styles.modal}><RotateCcw/><h3>Réinitialiser les préférences ?</h3><p>Vos données et vos analyses ne seront pas supprimées.</p><div><button onClick={()=>setConfirmReset(false)}>Annuler</button><button onClick={reset}>Réinitialiser</button></div></div></div>}
  </section>
}
