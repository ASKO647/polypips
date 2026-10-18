"use client";
import {useMemo,useState} from "react";
import {useLocale,useTranslations} from "next-intl";
import {ArrowLeft,ArrowRight,BarChart3,Bell,Bookmark,CalendarDays,Check,ChevronDown,ChevronLeft,ChevronRight,Clock3,Grid2X2,Layers3,List,Lock,RefreshCw,Shield,Sparkles,Star,Target,Trophy} from "lucide-react";
import {Link} from "@/i18n/navigation";
import {DashboardChrome} from "@/components/dashboard/shared/dashboard-chrome";
import {SportMatchResult} from "./sport-match-result";
import {OnDemandScanButton} from "@/components/dashboard/on-demand-scan-button";
import type {SportMatchAnalysis} from "@/lib/data/sports-analysis";
import {SYNC_SPORT_SELECTION_INTERVAL_MINUTES} from "@/lib/data/sports-analysis";
import type {PlanId} from "@/lib/stripe/plans";
import styles from "./sport-selection.module.css";
type Filter="all"|"football"|"basketball"|"tennis";
const sportLabel={football:"Football",basketball:"Basketball",tennis:"Tennis"};
const sportEmoji={football:"⚽",basketball:"🏀",tennis:"🎾"};
function names(value:string){const p=value.split(/\s+(?:vs\.?|contre|–|-)\s+/i);return [p[0]||value,p[1]||"Adversaire"]}
function confidence(c:string){const x=c.toLowerCase();return x.includes("high")||x.includes("élev")?"Confiance élevée":x.includes("low")||x.includes("faible")?"Confiance faible":"Confiance modérée"}
export function SportSelectionFlow({matches,hasActiveSubscription,currentPlan,lastSyncedAt}:{matches:SportMatchAnalysis[];hasActiveSubscription:boolean;currentPlan:PlanId|null;lastSyncedAt:string|null}){
 const locale=useLocale(),fr=locale!=="en",t=useTranslations("Sport.Selection");
 const[selected,setSelected]=useState<SportMatchAnalysis|null>(null),[filter,setFilter]=useState<Filter>("all"),[view,setView]=useState<"grid"|"list">("grid"),[dayOffset,setDayOffset]=useState(0),[direction,setDirection]=useState<"left"|"right">("left"),[followed,setFollowed]=useState<Set<string>>(new Set()),[saved,setSaved]=useState<Set<string>>(new Set()),[toast,setToast]=useState(false);
 const date=new Date();date.setDate(date.getDate()+dayOffset);const dayKey=date.toISOString().slice(0,10);
 const filtered=useMemo(()=>matches.filter(m=>(filter==="all"||m.sport===filter)&&(dayOffset===0||m.matchDate.slice(0,10)===dayKey)),[matches,filter,dayOffset,dayKey]);
 const nextRefresh=(()=>{const base=lastSyncedAt?new Date(lastSyncedAt).getTime():Date.now(),ms=Math.max(0,base+SYNC_SPORT_SELECTION_INTERVAL_MINUTES*60000-Date.now());return `${Math.floor(ms/3600000)} h ${Math.floor(ms%3600000/60000)} min`})();
 const move=(n:number)=>{setDirection(n>0?"left":"right");setDayOffset(v=>v+n)};
 const follow=(id:string)=>{setFollowed(v=>new Set(v).add(id));setToast(true);setTimeout(()=>setToast(false),3000)};
 const bookmark=(id:string)=>setSaved(v=>{const n=new Set(v);n.has(id)?n.delete(id):n.add(id);return n});
 if(selected)return <DashboardChrome title={fr?"Sélection du jour":"Today’s selection"}><main className={styles.resultPage}><SportMatchResult analysis={selected} onBack={()=>setSelected(null)} backLabel={t("backToListLabel")} locked={!hasActiveSubscription}/></main></DashboardChrome>;
 const featured=filtered[0],others=filtered.slice(1);
 return <DashboardChrome title={fr?"Sélection du jour":"Today’s selection"}><main className={styles.page}>{toast&&<div className={styles.toast}><Check/>{fr?"Vous serez averti des changements importants.":"You will be notified of important changes."}</div>}
  <header className={styles.hero}><div><h1>{fr?"Sélection du jour":"Today’s selection"}</h1><p>{fr?"Les confrontations sportives à surveiller, sélectionnées selon les données disponibles et leur intérêt d’analyse.":"Sports fixtures to watch, selected from available data and analysis interest."}</p></div><span><i/>{fr?"Actualisé récemment":"Updated recently"}</span><div className={styles.scan}><OnDemandScanButton feature="sports" currentPlan={currentPlan}/></div></header>
  <section className={styles.filters}><button onClick={()=>move(-1)} aria-label="Jour précédent"><ChevronLeft/></button><div className={`${styles.date} ${direction==="left"?styles.slideLeft:styles.slideRight}`}><CalendarDays/><b>{dayOffset===0?(fr?"Aujourd’hui":"Today"):new Intl.DateTimeFormat(locale,{weekday:"short",day:"numeric",month:"short"}).format(date)}</b></div><button onClick={()=>move(1)} aria-label="Jour suivant"><ChevronRight/></button><div className={styles.sports}>{(["all","football","basketball","tennis"] as Filter[]).map(x=><button key={x} className={filter===x?styles.filterOn:""} onClick={()=>setFilter(x)}>{x!=="all"&&<span>{sportEmoji[x]}</span>}{x==="all"?(fr?"Tous":"All"):sportLabel[x]}</button>)}</div><label>{fr?"Compétition":"Competition"}<ChevronDown/></label><label>{fr?"Horaire":"Time"}<ChevronDown/></label><div className={styles.views}><button className={view==="grid"?styles.viewOn:""} onClick={()=>setView("grid")}><Grid2X2/></button><button className={view==="list"?styles.viewOn:""} onClick={()=>setView("list")}><List/></button></div></section>
  <p className={styles.notice}>ⓘ {fr?"Cette sélection met en avant des rencontres à analyser. Elle ne garantit aucun résultat.":"This selection highlights fixtures to analyze. It guarantees no result."}</p>
  {!featured?<section className={styles.empty}><Sparkles/><h2>{t("emptyTitle")}</h2><p>{t("emptyDescription")}</p></section>:<>
   <MatchCard match={featured} featured locked={!hasActiveSubscription} followed={followed.has(featured.id)} saved={saved.has(featured.id)} onFollow={()=>follow(featured.id)} onSave={()=>bookmark(featured.id)} onOpen={()=>setSelected(featured)}/>
   <section className={`${styles.cards} ${view==="list"?styles.list:""}`}>{others.map((m,i)=><MatchCard key={m.id} match={m} locked={!hasActiveSubscription} followed={followed.has(m.id)} saved={saved.has(m.id)} onFollow={()=>follow(m.id)} onSave={()=>bookmark(m.id)} onOpen={()=>setSelected(m)} index={i}/>)}</section>
  </>}
  <footer className={styles.bottom}><div><BarChart3/><b>{matches.length}</b><span>{fr?"rencontres sélectionnées":"selected fixtures"}</span></div><div><Layers3/><b>{new Set(matches.map(m=>m.sport)).size}</b><span>sports</span></div><div><Clock3/><span>{fr?"Prochaine actualisation dans":"Next refresh in"}<b>{nextRefresh}</b></span></div><Link href="/dashboard/sports"><Sparkles/>{fr?"Analyser une autre confrontation":"Analyze another fixture"}<ArrowRight/></Link></footer>
 </main></DashboardChrome>
}
function MatchCard({match,featured=false,locked,followed,saved,onFollow,onSave,onOpen,index=0}:{match:SportMatchAnalysis;featured?:boolean;locked:boolean;followed:boolean;saved:boolean;onFollow:()=>void;onSave:()=>void;onOpen:()=>void;index?:number}){
 const locale=useLocale(),fr=locale!=="en",[a,b]=names(match.participants),date=new Intl.DateTimeFormat(locale,{weekday:featured?"short":undefined,hour:"2-digit",minute:"2-digit"}).format(new Date(match.matchDate));
 return <article className={`${styles.card} ${featured?styles.featured:""}`} style={{"--delay":`${index*70}ms`} as React.CSSProperties}><div className={styles.cardTop}>{featured&&<em><Star/>{fr?"À surveiller":"Watch"}</em>}<span>{sportEmoji[match.sport]} <b>{sportLabel[match.sport]}</b>{match.competition&&<> · {match.competition}</>}</span><small><CalendarDays/>{date}</small><button className={saved?styles.saved:""} onClick={onSave} aria-label="Favori"><Bookmark/></button></div><div className={styles.matchup}><span><Shield/><b>{a}</b></span><strong>VS</strong><span><Shield/><b>{b}</b></span></div><div className={styles.reading}><BarChart3/><p><b>{locked?(fr?"Analyse réservée":"Reserved analysis"):match.predictedWinner}</b><small>{match.explanation}</small></p></div><div className={styles.badges}><span className={styles.confidence}><Target/>{locked?"—":confidence(match.confidence)}</span><span><Trophy/>{fr?"Risque moyen":"Medium risk"}</span>{featured&&<span className={styles.complete}><Check/>{fr?"Données complètes":"Complete data"}</span>}</div><div className={styles.actions}><button onClick={onOpen}>{locked?<Lock/>:<BarChart3/>}{locked?(fr?"Déverrouiller":"Unlock"):(fr?"Voir l’analyse":"View analysis")}<ArrowRight/></button><button className={followed?styles.following:""} onClick={onFollow}>{followed?<Check/>:<Bell/>}{followed?(fr?"Suivi":"Following"):(fr?"Suivre":"Follow")}</button></div></article>
}
