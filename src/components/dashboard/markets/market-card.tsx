"use client";
import { ArrowRight, Bookmark, Lock, Activity, TriangleAlert } from "lucide-react";
import { type MarketAnalysis } from "@/lib/data/analysis";
import styles from "./markets-page.module.css";
export function MarketCard({market,onViewDetail,locked=false,index=0,view="grid"}:{market:MarketAnalysis;onViewDetail:()=>void;locked?:boolean;index?:number;view?:"grid"|"list"}){
 const [primary,secondary]=market.outcomes.length===2?market.outcomes:["Oui","Non"],yes=Math.max(0,Math.min(100,market.marketProbability)),no=100-yes,risk=Math.abs(market.edge)>=15?"high":Math.abs(market.edge)>=7?"medium":"low",key=`favorite-${market.id}`;
 const favorite=()=>{const el=document.getElementById(key),next=!el?.classList.contains(styles.saved);el?.classList.toggle(styles.saved,next);localStorage.setItem(key,String(next))};
 return <article className={`${styles.marketCard} ${view==="list"?styles.listCard:""}`} style={{"--delay":`${index*70}ms`} as React.CSSProperties}>
  <div className={styles.cardTop}><span className={styles.categoryIcon}>{market.category.slice(0,1).toUpperCase()}</span><span className={styles.category}>{market.category}</span><span className={styles.dotSep}/><span className={styles.age}>Analysé récemment</span><button id={key} className={styles.bookmark} onClick={favorite} aria-label="Ajouter aux favoris"><Bookmark/></button></div>
  <h2>{market.question}</h2>
  <div className={styles.marketPrice} aria-label="Prix du marché"><div className={styles.yesPrice} style={{"--price":`${yes}%`} as React.CSSProperties}><small>{primary}</small><b>{yes}%</b></div><span>Prix du marché</span><div className={styles.noPrice}><small>{secondary}</small><b>{no}%</b></div></div>
  <div className={styles.reading}><Activity/><div><b>Lecture Polypips</b><span>{locked?"Réservée aux abonnés":market.explanation}</span></div></div>
  <footer><span><Activity/> Volume analysé</span><span className={styles[`risk_${risk}`]}><TriangleAlert/> Risque {risk==="high"?"élevé":risk==="medium"?"moyen":"faible"}</span><button onClick={onViewDetail}>{locked?<><Lock/> Débloquer</>:<>Voir l’analyse <ArrowRight/></>}</button></footer>
 </article>
}
