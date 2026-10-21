"use client";

import { useState, useTransition } from "react";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { Accessibility, CheckCircle2, Clock3, Database, Globe2, Home, Languages, List, Moon, Palette, RotateCcw, Settings, Sun } from "lucide-react";
import { useDashboardTheme } from "@/providers/dashboard-theme-provider";
import { useCurrency, SUPPORTED_CURRENCIES } from "@/providers/currency-provider";
import { createClient } from "@/lib/supabase/client";
import { saveUserSettings, DEFAULT_USER_SETTINGS, type UserSettings, type ThemeChoice, type StartPage } from "@/lib/supabase/user-settings";
import styles from "./preferences-tab.module.css";

function Toggle({ value, label, onChange }: { value:boolean; label:string; onChange:()=>void }) {
  return <button type="button" role="switch" aria-checked={value} aria-label={label} className={`${styles.toggle} ${value ? styles.toggleOn : ""}`} onClick={onChange}><i /></button>;
}
function Segmented({ options, value, onChange }: { options:string[]; value:string; onChange:(value:string)=>void }) {
  return <div className={styles.segmented}>{options.map(option=><button type="button" className={value===option?styles.selected:""} onClick={()=>onChange(option)} key={option}>{option}</button>)}</div>;
}

const DENSITY_LABELS = { comfortable: "Confortable", compact: "Compacte" } as const;

export function PreferencesTab({ initialSettings }: { initialSettings: UserSettings }){
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [, startTransition] = useTransition();
  const { setTheme } = useDashboardTheme();
  const { currency, setCurrency } = useCurrency();

  const [themeChoice,setThemeChoice]=useState<ThemeChoice>(initialSettings.themeChoice);
  const [density,setDensity]=useState<"comfortable"|"compact">(initialSettings.density);
  const [animations,setAnimations]=useState(initialSettings.animations);
  const [timezone,setTimezone]=useState(initialSettings.timezone);
  const [dateFormat,setDateFormat]=useState<"long"|"short">(initialSettings.dateFormat);
  const [startPage,setStartPage]=useState<StartPage>(initialSettings.startPage);
  const [resume,setResume]=useState(initialSettings.resumeLastSession);
  const [textSize,setTextSize]=useState(initialSettings.textSize);
  const [reduceMotion,setReduceMotion]=useState(initialSettings.reduceMotion);
  const [contrast,setContrast]=useState(initialSettings.contrast);
  const [keyboardFocus,setKeyboardFocus]=useState(initialSettings.keyboardFocus);
  const [saved,setSaved]=useState(false);
  const [saving,setSaving]=useState(false);
  const [dirty,setDirty]=useState(false);
  const [confirmReset,setConfirmReset]=useState(false);

  const change=(fn:()=>void)=>{fn();setDirty(true);setSaved(false)};
  const chooseTheme=(choice:ThemeChoice)=>change(()=>{setThemeChoice(choice);if(choice==="system")setTheme(window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");else setTheme(choice)});

  const save=async()=>{
    if(saving)return;
    setSaving(true);
    try{
      const supabase=createClient();
      const {data:{user}}=await supabase.auth.getUser();
      if(user){
        await saveUserSettings(supabase,user.id,{themeChoice,density,animations,timezone,dateFormat,startPage,resumeLastSession:resume,textSize,reduceMotion,contrast,keyboardFocus});
      }
      setDirty(false);setSaved(true);
      window.setTimeout(()=>setSaved(false),3000);
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  const reset=async()=>{
    const d=DEFAULT_USER_SETTINGS;
    setThemeChoice(d.themeChoice);setTheme(d.themeChoice==="system"?(window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"):d.themeChoice);
    setDensity(d.density);setAnimations(d.animations);setTimezone(d.timezone);setDateFormat(d.dateFormat);
    setStartPage(d.startPage);setResume(d.resumeLastSession);setTextSize(d.textSize);setReduceMotion(d.reduceMotion);
    setContrast(d.contrast);setKeyboardFocus(d.keyboardFocus);
    setConfirmReset(false);setSaved(true);setDirty(false);
    const supabase=createClient();
    const {data:{user}}=await supabase.auth.getUser();
    if(user) await saveUserSettings(supabase,user.id,d);
    router.refresh();
  };

  const switchLocale=(next:string)=>{
    if(next===locale)return;
    startTransition(()=>{router.replace(pathname,{locale: next as (typeof routing.locales)[number]})});
  };

  return <section className={`${styles.root} ${density==="compact"?styles.compact:""} ${reduceMotion?styles.reduced:""} ${contrast?styles.highContrast:""} ${keyboardFocus?styles.strongFocus:""}`} style={{ fontSize: `${90 + textSize * 0.2}%` }}>
    {saved&&<div className={styles.toast}><CheckCircle2/>Préférences enregistrées</div>}
    <button id="preferences-save-action" className={styles.hiddenAction} onClick={save}/>
    <div className={styles.grid}>
      <article className={styles.card}>
        <header><Palette/><div><h2>Apparence</h2><p>Choisissez le thème et l’aspect de l’interface.</p></div></header>
        <div className={styles.themes}>{(["light","dark","system"] as ThemeChoice[]).map((choice)=><button className={themeChoice===choice?styles.themeSelected:""} onClick={()=>chooseTheme(choice)} key={choice}><div className={`${styles.themePreview} ${styles[choice]}`}><aside/><main><i/><i/><i/></main></div><span>{choice==="light"?<Sun/>:choice==="dark"?<Moon/>:<Palette/>}{choice==="light"?"Clair":choice==="dark"?"Sombre":"Système"}</span></button>)}</div>
        <div className={styles.inline}><label>Densité de l’interface<Segmented options={["Confortable","Compacte"]} value={DENSITY_LABELS[density]} onChange={value=>change(()=>setDensity(value==="Compacte"?"compact":"comfortable"))}/></label><div><span>Animations de l’interface</span><Toggle value={animations} label="Animations de l’interface" onChange={()=>change(()=>setAnimations(value=>!value))}/></div></div>
      </article>

      <article className={styles.card}><header><Globe2/><div><h2>Langue et région</h2><p>Configurez votre langue, votre fuseau horaire et vos préférences régionales.</p></div></header><div className={styles.formRows}>
        <label><Languages/>Langue<select value={locale} onChange={e=>switchLocale(e.target.value)}>{routing.locales.map(code=><option value={code} key={code}>{code==="fr"?"Français":"English"}</option>)}</select></label>
        <label><Clock3/>Fuseau horaire<select value={timezone} onChange={e=>change(()=>setTimezone(e.target.value))}><option value="Europe/Paris">Europe/Paris</option><option value="UTC">UTC</option><option value="America/New_York">America/New_York</option></select></label>
        <label><List/>Format de date<select value={dateFormat} onChange={e=>change(()=>setDateFormat(e.target.value as "long"|"short"))}><option value="long">21 octobre 2026</option><option value="short">21/10/2026</option></select></label>
        <label><Database/>Devise<select value={currency} onChange={e=>{setCurrency(e.target.value as typeof currency).catch(()=>{})}}>{SUPPORTED_CURRENCIES.map(c=><option value={c.code} key={c.code}>{c.label}</option>)}</select></label>
      </div></article>

      <article className={styles.card}><header><Settings/><div><h2>Expérience Polypips</h2><p>Choisissez votre page de démarrage et vos préférences de navigation.</p></div></header><div className={styles.formRows}>
        <label><Home/>Page affichée au démarrage<select value={startPage} onChange={e=>change(()=>setStartPage(e.target.value as StartPage))}><option value="dashboard">Tableau de bord</option><option value="polymarket">Polymarket</option></select></label>
        <div><RotateCcw/><span>Reprendre ma dernière session</span><Toggle value={resume} label="Reprendre ma dernière session" onChange={()=>change(()=>setResume(v=>!v))}/></div>
      </div></article>

      <article className={styles.card}><header><Accessibility/><div><h2>Accessibilité</h2><p>Adaptez l’interface à vos besoins.</p></div></header><div className={styles.accessRows}>
        <label><span>Taille du texte</span><small>A−</small><input type="range" min="0" max="100" value={textSize} onChange={e=>change(()=>setTextSize(Number(e.target.value)))}/><small>A+</small><b>{textSize<35?"Petite":textSize>65?"Grande":"Moyenne"}</b></label>
        <div><span>Réduire les animations</span><Toggle value={reduceMotion} label="Réduire les animations" onChange={()=>change(()=>setReduceMotion(v=>!v))}/></div>
        <div><span>Contraste renforcé</span><Toggle value={contrast} label="Contraste renforcé" onChange={()=>change(()=>setContrast(v=>!v))}/></div>
        <div><span>Focus clavier renforcé</span><Toggle value={keyboardFocus} label="Focus clavier renforcé" onChange={()=>change(()=>setKeyboardFocus(v=>!v))}/></div>
      </div></article>
    </div>
    <button className={styles.reset} onClick={()=>setConfirmReset(true)}><RotateCcw/><span><b>Réinitialiser toutes les préférences</b><small>Cette action ne supprime aucune donnée de votre compte.</small></span></button>
    <div className={styles.mobileSave}><button disabled={!dirty||saving} onClick={save}>{saving?"Enregistrement…":"Enregistrer les préférences"}</button></div>
    {confirmReset&&<div className={styles.overlay}><div className={styles.modal}><RotateCcw/><h3>Réinitialiser les préférences ?</h3><p>Vos données et vos analyses ne seront pas supprimées.</p><div><button onClick={()=>setConfirmReset(false)}>Annuler</button><button onClick={reset}>Réinitialiser</button></div></div></div>}
  </section>
}
