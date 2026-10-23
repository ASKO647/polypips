"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { BrainCircuit, Check, Clock3, Loader2, ShieldCheck, X } from "lucide-react";
import { CREDIT_PACK_ORDER, CREDIT_PACKS, pricePerCredit, type CreditPackId } from "@/lib/stripe/credit-packs";
import { fetchCreditBalance, fetchCreditTransactions, type CreditTransaction } from "@/lib/supabase/credits";
import { createClient } from "@/lib/supabase/client";
import { ReferralCard } from "@/components/dashboard/credits/referral-card";
import { DashboardChrome } from "@/components/dashboard/shared/dashboard-chrome";
import styles from "./credits-page.module.css";

function BalanceNumber({value}:{value:number}) {
  const [display,setDisplay]=useState(value);
  const previous=useRef(0);
  useEffect(()=>{
    if(window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.querySelector('[data-motion="reduced"]')){setDisplay(value);previous.current=value;return;}
    const from=previous.current,start=performance.now();let frame=0;
    const tick=(now:number)=>{const p=Math.min((now-start)/(from===0?600:450),1);setDisplay(Math.round(from+(value-from)*(1-Math.pow(1-p,3))));if(p<1)frame=requestAnimationFrame(tick);};
    frame=requestAnimationFrame(tick);previous.current=value;return()=>cancelAnimationFrame(frame);
  },[value]);
  return <>{display}</>;
}

const purchaseKey="polypips-pending-credit-purchase";
export function CreditsPageContent({balance,transactions,referralSlug}:{balance:number;transactions:CreditTransaction[];referralSlug:string|null}) {
  const t=useTranslations("Credits"),locale=useLocale(),fr=locale==="fr",params=useSearchParams();
  const [currentBalance,setBalance]=useState(balance),[history,setHistory]=useState(transactions);
  const [chosen,setChosen]=useState<CreditPackId|null>(null),[showHistory,setShowHistory]=useState(false),[pending,setPending]=useState(false),[verifying,setVerifying]=useState(false),[success,setSuccess]=useState(false),[error,setError]=useState<string|null>(null);
  const dialog=useRef<HTMLDialogElement>(null),buyLock=useRef(false);
  useEffect(()=>{const unlock=(event:PageTransitionEvent)=>{if(event.persisted){buyLock.current=false;setPending(false);}};window.addEventListener("pageshow",unlock);return()=>window.removeEventListener("pageshow",unlock);},[]);
  const money=(amount:number)=>new Intl.NumberFormat(locale,{style:"currency",currency:"EUR"}).format(amount);
  useEffect(()=>{if(chosen||showHistory)dialog.current?.showModal();else dialog.current?.close();},[chosen,showHistory]);
  useEffect(()=>{
    if(params.get("purchase")!=="success")return;
    let active=true,timer:ReturnType<typeof setTimeout>;let oldIds:string[]|null=null;
    try{const raw=sessionStorage.getItem(purchaseKey);if(raw)oldIds=JSON.parse(raw).ids;}catch{}
    if(!Array.isArray(oldIds)){setError(fr?"Actualisez votre historique pour vérifier le paiement.":"Refresh your history to verify payment.");return;}
    setVerifying(true);const started=Date.now(),baseline=new Set(oldIds);
    const refresh=async()=>{
      try{
        const client=createClient();
        const [nextBalance,nextHistory]=await Promise.all([fetchCreditBalance(client),fetchCreditTransactions(client)]);
        if(!active)return;
        setBalance(nextBalance);setHistory(nextHistory);
        if(nextHistory.some(tx=>tx.type==="purchase"&&!baseline.has(tx.id))){
          setSuccess(true);setVerifying(false);sessionStorage.removeItem(purchaseKey);return;
        }
      }catch{}
      if(active&&Date.now()-started<60000)timer=setTimeout(refresh,2000);
      else if(active){setVerifying(false);setError(fr?"Le paiement est encore en cours de confirmation. Consultez l’historique dans quelques instants.":"Payment confirmation is still pending. Check history shortly.");}
    };
    refresh();return()=>{active=false;clearTimeout(timer);};
  },[params,fr]);
  const buy=async()=>{
    if(!chosen||buyLock.current)return;
    buyLock.current=true;setPending(true);setError(null);
    try{
      sessionStorage.setItem(purchaseKey,JSON.stringify({ids:history.filter(tx=>tx.type==="purchase").map(tx=>tx.id)}));
      const response=await fetch("/api/checkout/credits",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({pack:chosen,locale})});
      const data=await response.json();if(!response.ok||!data.url)throw new Error(data.message||t("genericError"));
      window.location.assign(data.url);
    }catch(e){setError(e instanceof Error?e.message:t("genericError"));setPending(false);buyLock.current=false;}
  };
  const openHistory=async()=>{setShowHistory(true);try{const client=createClient();const [b,h]=await Promise.all([fetchCreditBalance(client),fetchCreditTransactions(client,100)]);setBalance(b);setHistory(h);}catch{setError(t("genericError"));}};
  const row=(tx:CreditTransaction)=><div className={styles.transaction} key={tx.id}><div><strong>{t(`History.${tx.type}`)}</strong><small>{new Intl.DateTimeFormat(locale,{dateStyle:"medium",timeStyle:"short"}).format(new Date(tx.createdAt))}</small><span>{tx.type==="purchase"?(fr?"Crédits achetés":"Purchased credits"):tx.type==="plan_grant"||tx.type==="plan_reset"?(fr?"Crédits d’abonnement":"Subscription credits"):t(`History.${tx.type}`)}</span></div><b className={tx.amount>0?styles.positive:styles.negative}>{tx.amount>0?"+":""}{tx.amount}</b></div>;
  return <DashboardChrome hideHeader title={t("title")}><main className={styles.page}>
    <header className={styles.header}><div><p className={styles.breadcrumb}>Polypips / {fr?"Profil / Crédits":"Profile / Credits"}</p><h1>{t("title")}</h1><p>{t("description")}</p></div><button className={styles.outline} onClick={openHistory}><Clock3/>{fr?"Historique des crédits":"Credit history"}</button></header>
    {verifying&&<p className={styles.notice} role="status"><Loader2/>{fr?"Confirmation de votre achat…":"Confirming your purchase…"}</p>}
    {success&&<p className={styles.success} role="status"><Check/>{t("purchaseSuccess")}</p>}
    {params.get("purchase")==="cancelled"&&<p className={styles.notice}>{t("purchaseCancelled")}</p>}
    {error&&<p role="alert" className={styles.error}>{error}</p>}
    <div className={styles.topGrid}><section className={styles.balance}><span><BrainCircuit/></span><div><small>{t("balanceLabel")}</small><h2><BalanceNumber value={currentBalance}/> {t("balanceUnit",{count:currentBalance})}</h2><p>{fr?"Les crédits achetés n’expirent pas":"Purchased credits do not expire"}</p></div><button className={styles.primary} onClick={()=>document.getElementById("credit-packs")?.scrollIntoView({behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"instant":"smooth"})}>{fr?"Acheter des crédits":"Buy credits"}</button></section><div className={styles.referral}><ReferralCard referralSlug={referralSlug}/></div></div>
    <section id="credit-packs"><h2 className={styles.sectionTitle}>{t("packsTitle")}</h2><p className={styles.subtitle}>{fr?"Choisissez un pack selon votre fréquence d’utilisation.":"Choose a pack to suit your usage."}</p><div className={styles.packs}>{CREDIT_PACK_ORDER.map((id,index)=>{const pack=CREDIT_PACKS[id],highlight=id==="standard"||id==="power";return <article key={id} className={`${styles.pack} ${highlight?styles.highlight:""} ${chosen===id?styles.chosen:""}`} style={{"--delay":`${index*70}ms`} as React.CSSProperties}><div className={styles.packTitle}><h3>{t(`packs.${id}.name`)}</h3>{highlight&&<span>{id==="standard"?t("mostPopular"):t("bestValue")}</span>}</div><p>{t(`packs.${id}.description`)}</p><strong>{money(pack.priceCents/100)}</strong><span>{t("creditsLabel",{count:pack.credits})}</span><small>{t("pricePerCredit",{price:money(pricePerCredit(pack))})}</small><button className={highlight?styles.primary:styles.outline} disabled={pending||verifying} onClick={()=>{setError(null);setChosen(id);}}>{t("buyButton")}</button></article>})}</div></section>
    <section className={styles.explainer}><strong>{fr?"Comment fonctionnent les crédits ?":"How do credits work?"}</strong><span>1 {fr?"crédit = 1 Analyse Approfondie":"credit = 1 Deep Analysis"}</span><span>{fr?"Débit uniquement au lancement":"Debited only when launched"}</span><span><ShieldCheck/>{fr?"Paiement sécurisé":"Secure payment"}</span><small>{fr?"Les crédits inclus dans l’abonnement sont renouvelés par cycle ; les crédits achetés n’expirent pas.":"Subscription credits renew each cycle; purchased credits do not expire."}</small></section>
    <section className={styles.recent}><header><div><h2>{fr?"Historique récent":"Recent history"}</h2>{!history.length&&<p>{t("History.empty")}</p>}</div><button className={styles.outline} onClick={openHistory}>{fr?"Voir tout l’historique":"View all history"}</button></header>{history.slice(0,3).map(row)}</section>
    <dialog ref={dialog} className={styles.drawer} onCancel={event=>{if(pending)event.preventDefault();else{setChosen(null);setShowHistory(false);}}}><button className={styles.close} disabled={pending} aria-label={fr?"Fermer":"Close"} onClick={()=>{setChosen(null);setShowHistory(false);}}><X/></button>{showHistory?<><h2>{t("History.title")}</h2>{history.length?history.map(row):<p>{t("History.empty")}</p>}</>:chosen&&<><BrainCircuit className={styles.brain}/><h2>{fr?"Confirmez votre pack":"Confirm your pack"}</h2><h3>{t(`packs.${chosen}.name`)}</h3><dl><dt>{fr?"Nombre de crédits":"Credits"}</dt><dd>{CREDIT_PACKS[chosen].credits}</dd><dt>{fr?"Montant total":"Total amount"}</dt><dd>{money(CREDIT_PACKS[chosen].priceCents/100)}</dd></dl><p>{fr?"Paiement unique en euros. Les crédits seront ajoutés après confirmation du paiement.":"One-time payment in euros. Credits are added after payment confirmation."}</p>{error&&<p role="alert" className={styles.error}>{error}</p>}<button className={styles.primary} disabled={pending} onClick={buy}>{pending?<><Loader2/>{fr?"Redirection vers le paiement…":"Redirecting to checkout…"}</>:(fr?"Confirmer et payer":"Confirm and pay")}</button></>}</dialog>
  </main></DashboardChrome>;
}
