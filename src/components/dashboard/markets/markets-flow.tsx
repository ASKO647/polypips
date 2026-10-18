"use client";
import { useEffect,useMemo,useState } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { Bell,Bookmark,ChevronDown,ChevronRight,CircleUserRound,Clock3,Grid2X2,GraduationCap,LayoutDashboard,List,Menu,RefreshCw,Search,Sparkles,TrendingUp,Trophy,Users,Wallet,X } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { AnalysisResult } from "@/components/dashboard/analyse-ia/analysis-result";
import { MarketCard } from "./market-card";
import type { MarketAnalysis } from "@/lib/data/analysis";
import type { PlanId } from "@/lib/stripe/plans";
import { meetsPlan } from "@/lib/plan-access";
import { SYNC_MARKETS_INTERVAL_MINUTES } from "@/lib/data/markets";
import { DashboardChrome } from "@/components/dashboard/shared/dashboard-chrome";
import styles from "./markets-page.module.css";
const copy={fr:{crumb:"Marchés sélectionnés",title:"Marchés sélectionnés par l’IA",sub:"opportunités actualisées toutes les 12 heures selon l’activité, les données et les risques.",search:"Rechercher un marché",all:"Tous",refresh:"Actualiser",refreshing:"Actualisation…",done:"Actualisé à l’instant",notice:"La sélection met en avant les marchés à surveiller. Elle ne constitue pas un conseil financier.",empty:"Aucun marché ne correspond à vos filtres.",reset:"Réinitialiser les filtres",next:"Prochaine actualisation dans",analyze:"Analyser un autre marché"},en:{crumb:"Selected markets",title:"AI-selected markets",sub:"opportunities refreshed every 12 hours based on activity, data and risk.",search:"Search a market",all:"All",refresh:"Refresh",refreshing:"Refreshing…",done:"Updated just now",notice:"This selection highlights markets worth watching. It is not financial advice.",empty:"No market matches your filters.",reset:"Reset filters",next:"Next refresh in",analyze:"Analyze another market"}};
export function MarketsFlow({markets:allMarkets,hasActiveSubscription,currentPlan,lastSyncedAt}:{markets:MarketAnalysis[];hasActiveSubscription:boolean;currentPlan:PlanId|null;lastSyncedAt:string|null}){
 const c=useLocale()==="en"?copy.en:copy.fr,router=useRouter();
 const[selected,setSelected]=useState<MarketAnalysis|null>(null),[category,setCategory]=useState(c.all),[query,setQuery]=useState(""),[debounced,setDebounced]=useState(""),[view,setView]=useState<"grid"|"list">("grid"),[mobile,setMobile]=useState(false),[pending,setPending]=useState(false),[done,setDone]=useState(false),[remaining,setRemaining]=useState(0);
 useEffect(()=>{const id=setTimeout(()=>setDebounced(query),250);return()=>clearTimeout(id)},[query]);
 useEffect(()=>{const tick=()=>{const base=lastSyncedAt?new Date(lastSyncedAt).getTime():Date.now();setRemaining(Math.max(0,base+SYNC_MARKETS_INTERVAL_MINUTES*60000-Date.now()))};tick();const id=setInterval(tick,60000);return()=>clearInterval(id)},[lastSyncedAt]);
 const categories=useMemo(()=>[c.all,...Array.from(new Set(allMarkets.map(m=>m.category)))],[allMarkets,c.all]);
 const markets=useMemo(()=>allMarkets.filter(m=>(category===c.all||m.category===category)&&m.question.toLowerCase().includes(debounced.toLowerCase())),[allMarkets,category,debounced,c.all]);
 const refresh=async()=>{if(pending)return;if(!meetsPlan(currentPlan,"pro_plus")){router.push("/dashboard/subscription");return}setPending(true);setDone(false);try{const res=await fetch("/api/scan/markets",{method:"POST"});if(!res.ok)throw new Error();router.refresh();setDone(true);setTimeout(()=>setDone(false),1000)}finally{setPending(false)}};
 const reset=()=>{setQuery("");setCategory(c.all)},hours=Math.floor(remaining/3600000),mins=Math.floor((remaining%3600000)/60000);
 if(selected)return <div className={styles.result}><AnalysisResult analysis={selected} onBack={()=>setSelected(null)} backLabel={c.crumb} locked={!hasActiveSubscription}/></div>;
 return <DashboardChrome title={c.crumb}><main className={styles.pageMain}><div className={styles.hero}><div><h1>{c.title}</h1><p>{allMarkets.length||9} {c.sub}</p></div><div className={`${styles.status} ${done?styles.done:""}`}><i/>{done?c.done:"Actualisé récemment"}</div><button className={styles.refresh} onClick={refresh} disabled={pending}><RefreshCw className={pending?styles.spinning:""}/>{pending?c.refreshing:c.refresh}</button></div>
 <section className={styles.filters}><label><Search/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder={c.search}/></label><div className={styles.categories}>{categories.map(x=><button key={x} onClick={()=>setCategory(x)} className={category===x?styles.selectedFilter:""}>{x}</button>)}</div><div className={styles.viewToggle}><button className={view==="grid"?styles.viewActive:""} onClick={()=>setView("grid")}><Grid2X2/></button><button className={view==="list"?styles.viewActive:""} onClick={()=>setView("list")}><List/></button></div></section>
 <div className={styles.notice}>ⓘ <span>{c.notice}</span></div><section className={`${styles.cards} ${view==="list"?styles.list:""} ${pending?styles.loading:""}`}>{markets.map((m,i)=><MarketCard key={m.id} market={m} index={i} view={view} locked={!hasActiveSubscription} onViewDetail={()=>setSelected(m)}/>)}</section>
 {!markets.length&&<section className={styles.empty}><Search/><h2>{c.empty}</h2><button onClick={reset}>{c.reset}</button></section>}
 <section className={styles.bottomBar}><div><TrendingUp/><b>{allMarkets.length}</b><span>marchés sélectionnés</span></div><div><Bookmark/><b>{Math.max(1,categories.length-1)}</b><span>catégories actives</span></div><div><Clock3/><span>{c.next}<b>{hours} h {mins} min</b></span></div><Link href="/dashboard/analyse-ia"><Sparkles/>{c.analyze}<ChevronRight/></Link></section></main></DashboardChrome>
}
