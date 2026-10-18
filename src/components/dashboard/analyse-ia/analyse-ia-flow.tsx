"use client";

import { useState } from "react";
import { Bell, CandlestickChart, ChevronDown, CircleUserRound, GraduationCap, LayoutDashboard, LineChart, Menu, Search, Sparkles, Star, Trophy, Users, Wallet, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { AnalysisInput } from "./analysis-input";
import { AnalysisLoading } from "./analysis-loading";
import { AnalysisResult } from "./analysis-result";
import { analysisErrorMessage, type AnalysisProgressStep, type MarketAnalysis } from "@/lib/data/analysis";
import { AnalysisRequestError, runMarketAnalysis, type AnalyzeMarketRequest } from "@/lib/supabase/analyze-market-client";
import { DashboardChrome } from "@/components/dashboard/shared/dashboard-chrome";
import styles from "./polymarket-analysis.module.css";

type FlowState="input"|"loading"|"result";
const groups=[{title:"POLYMARKET",color:"#ef2947",items:[["Analyse IA","/dashboard/analyse-ia",Sparkles],["Marchés sélectionnés","/dashboard/markets",LineChart],["Smart Wallet","/dashboard/copy-trading",Wallet]]},{title:"SPORT",color:"#16b97d",items:[["Analyse IA","/dashboard/sports",Sparkles],["Sélection du jour","/dashboard/sports/selection",Star],["Mes analyses","/dashboard/sports/mes-analyses",Trophy]]},{title:"TRADING",color:"#f4b400",items:[["Analyse IA","/dashboard/trading",CandlestickChart],["Sélection du jour","/dashboard/trading/selection",Star],["Mes analyses","/dashboard/trading/mes-analyses",LineChart]]}] as const;

function errorContentFor(error:unknown,t:(key:string)=>string,tCredits:(key:string)=>string):React.ReactNode{
 if(error instanceof AnalysisRequestError&&error.code==="no_credits")return <>{tCredits("DeepAnalysis.noCreditsMessage")} <Link href="/dashboard/credits">{tCredits("DeepAnalysis.buyCreditsCta")}</Link></>;
 if(error instanceof AnalysisRequestError&&error.code==="limit_reached")return <>{error.message} <Link href="/dashboard/settings">{t("changePlanLink")}</Link></>;
 return analysisErrorMessage(error instanceof AnalysisRequestError?error.code:"unknown",t);
}

function AnalysisChrome({children}:{children:React.ReactNode}){
 return <DashboardChrome title="Analyse IA"><main className={styles.main}>{children}</main></DashboardChrome>
}

export function AnalyseIaFlow({initialRecentAnalyses,hasActiveSubscription,creditBalance}:{initialRecentAnalyses:MarketAnalysis[];hasActiveSubscription:boolean;creditBalance:number}){
 const t=useTranslations("Polymarket.AnalyseIa"),tCredits=useTranslations("Credits");
 const[state,setState]=useState<FlowState>("input"),[result,setResult]=useState<MarketAnalysis|null>(null),[recent,setRecent]=useState(initialRecentAnalyses),[step,setStep]=useState<AnalysisProgressStep|null>(null),[error,setError]=useState<React.ReactNode|null>(null),[link,setLink]=useState(""),[file,setFile]=useState<File|null>(null);
 const analyze=async(request:AnalyzeMarketRequest)=>{setError(null);setStep(null);setState("loading");try{const analysis=await runMarketAnalysis(request,setStep);setResult(analysis);setRecent(v=>[analysis,...v].slice(0,5));setLink("");setFile(null);setState("result")}catch(e){setError(errorContentFor(e,t,tCredits));setState("input")}};
 return <AnalysisChrome>{state==="loading"?<AnalysisLoading currentStep={step}/>:state==="result"&&result?<div className={styles.resultEnter}><AnalysisResult analysis={result} onBack={()=>{setResult(null);setError(null);setState("input")}} locked={!hasActiveSubscription}/></div>:<AnalysisInput recentAnalyses={recent} errorMessage={error} link={link} onLinkChange={setLink} file={file} onFileChange={setFile} onAnalyze={analyze} onSelectRecent={a=>{setResult(a);setState("result")}} creditBalance={creditBalance}/>}</AnalysisChrome>
}
