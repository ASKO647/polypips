"use client";

import { useRef, useState } from "react";
import { useLocale } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { CalendarDays, Camera, CheckCircle2, Crown, Database, Download, Loader2, LockKeyhole, Settings, ShieldCheck, Trash2, UserRound } from "lucide-react";
import { UserAvatar } from "@/components/dashboard/user-avatar";
import { createClient } from "@/lib/supabase/client";
import { uploadAvatar, removeAvatar, validateAvatarFile } from "@/lib/supabase/avatar";
import { ChangeEmailButton } from "@/components/dashboard/settings/change-email-button";
import { MfaEnrollModal } from "@/components/dashboard/settings/mfa-enroll-modal";
import type { PricingPlan } from "@/lib/data/pricing";
import type { SubscriptionRow } from "@/lib/supabase/subscriptions";
import type { ProfileActivityStats } from "@/lib/supabase/profile-activity";
import styles from "./profile-overview-tab.module.css";

type Props = {
  email:string; initialUsername:string; initialPseudo:string; initialAvatarUrl:string|null;
  memberSince:string|null; googleConnected:boolean; mfaEnabled:boolean; currentPlan:PricingPlan|null;
  subscription:SubscriptionRow|null; periodEndLabel:string|null; activity:ProfileActivityStats;
  onOpenCancelModal:()=>void; onOpenDeleteModal:()=>void; deletionRequested:boolean;
  actionError:string|null; creditBalance:number; referralSlug:string|null;
};

export function ProfileOverviewTab(props:Props){
  const locale=useLocale(); const fr=locale==="fr"; const router=useRouter();
  const [name,setName]=useState(props.initialUsername); const [pseudo,setPseudo]=useState(props.initialPseudo);
  const [avatar,setAvatar]=useState(props.initialAvatarUrl); const [uploading,setUploading]=useState(false);
  const [avatarError,setAvatarError]=useState<string|null>(null); const [saving,setSaving]=useState(false);
  const [saved,setSaved]=useState(false); const [error,setError]=useState<string|null>(null);
  const [country,setCountry]=useState("France"); const [phone,setPhone]=useState(""); const [birthDate,setBirthDate]=useState("");
  const [mfaModalOpen,setMfaModalOpen]=useState(false);
  const inputRef=useRef<HTMLInputElement>(null);
  const dirty=name!==props.initialUsername||pseudo!==props.initialPseudo||phone!==""||birthDate!=="";
  const active=(props.subscription?.status==="active"||props.subscription?.status==="trialing")&&!props.subscription?.cancelAtPeriodEnd;

  async function save(){if(saving||!dirty)return;setSaving(true);setError(null);const supabase=createClient();const {error:e}=await supabase.auth.updateUser({data:{full_name:name.trim(),username:pseudo.trim(),phone,country,birth_date:birthDate}});setSaving(false);if(e)setError(e.message);else setSaved(true)}
  async function pick(event:React.ChangeEvent<HTMLInputElement>){const file=event.target.files?.[0];event.target.value="";if(!file)return;const validation=validateAvatarFile(file);if(validation){setAvatarError(validation);return}setUploading(true);setAvatarError(null);try{const supabase=createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)throw new Error(fr?"Session expirée":"Session expired");setAvatar(await uploadAvatar(supabase,user.id,file));router.refresh()}catch(e){setAvatarError(e instanceof Error?e.message:"Upload impossible")}finally{setUploading(false)}}
  async function removePhoto(){const supabase=createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)return;setUploading(true);setAvatarError(null);try{await removeAvatar(supabase,user.id);setAvatar(null);router.refresh()}catch(e){setAvatarError(e instanceof Error?e.message:(fr?"Suppression impossible":"Could not remove photo"))}finally{setUploading(false)}}
  async function resetPassword(){const supabase=createClient();const {error:e}=await supabase.auth.resetPasswordForEmail(props.email,{redirectTo:`${window.location.origin}/reset-password`});if(e)setError(e.message);else setSaved(true)}

  return <div className={styles.layout}>
    <aside className={styles.left}>
      <article className={`${styles.card} ${styles.identity}`}>
        <div className={styles.avatarWrap}><UserAvatar name={name||props.email} avatarUrl={avatar} size={118}/><button onClick={()=>inputRef.current?.click()} disabled={uploading}>{uploading?<Loader2/>:<Camera/>}</button><input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={pick}/></div>
        <h2>{name||"Polypips"}<CheckCircle2/></h2><p>{props.email}</p><span className={styles.planBadge}><Crown/>{props.currentPlan?.name??(fr?"Compte gratuit":"Free account")}</span>
        <button className={styles.primary} onClick={()=>inputRef.current?.click()}><Camera/>{fr?"Modifier la photo":"Change photo"}</button>
        {avatar&&<button className={styles.deletePhoto} onClick={removePhoto} disabled={uploading}><Trash2/>{fr?"Supprimer":"Remove"}</button>}
        {avatarError&&<small className={styles.error}>{avatarError}</small>}
      </article>
      <article className={`${styles.card} ${styles.planCard}`}><div className={styles.cardTitle}><Crown/><div><h3>{fr?"Offre":"Plan"} {props.currentPlan?.name??"Polypips"}</h3><strong>{props.currentPlan?`${props.currentPlan.priceEur.toFixed(2).replace(".",",")} €`:"—"}<span>{fr?" / mois":" / month"}</span></strong></div><em>{active?(fr?"Actif":"Active"):(fr?"Inactif":"Inactive")}</em></div><p><CalendarDays/>{fr?"Prochaine facturation":"Next billing"}<b>{props.periodEndLabel??"—"}</b></p><button className={styles.primary} onClick={props.onOpenCancelModal}><Settings/>{fr?"Gérer l’abonnement":"Manage subscription"}</button><Link href="/dashboard/subscription">{fr?"Voir les offres":"View plans"}</Link></article>
    </aside>

    <main className={styles.main}>
      <article className={styles.card}><div className={styles.sectionTitle}><UserRound/><div><h3>{fr?"Informations personnelles":"Personal information"}</h3><p>{fr?"Ces informations servent à gérer votre compte et personnaliser votre expérience.":"This information is used to manage and personalize your account."}</p></div></div><div className={styles.formGrid}>
        <label>{fr?"Nom complet":"Full name"}<input value={name} onChange={e=>{setName(e.target.value);setSaved(false)}}/></label>
        <label>{fr?"Nom d’utilisateur":"Username"}<div className={styles.suffix}><input value={pseudo} onChange={e=>{setPseudo(e.target.value);setSaved(false)}}/><span>@</span></div></label>
        <label>{fr?"Adresse e-mail":"Email address"}<span className={styles.emailValue}>{props.email}</span><ChangeEmailButton currentEmail={props.email}/></label>
        <label>{fr?"Téléphone":"Phone"}<input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+33 6 12 34 56 78"/></label>
        <label>{fr?"Pays / région":"Country / region"}<select value={country} onChange={e=>setCountry(e.target.value)}><option>France</option><option>Belgique</option><option>Suisse</option><option>Canada</option></select></label>
        <label>{fr?"Date de naissance":"Birth date"}<input type="date" value={birthDate} onChange={e=>setBirthDate(e.target.value)}/></label>
      </div></article>

      <div className={styles.bottomGrid}><article className={styles.card}><div className={styles.sectionTitle}><LockKeyhole/><div><h3>{fr?"Sécurité":"Security"}</h3><p>{fr?"Protégez votre compte avec des mesures renforcées.":"Protect your account with stronger security."}</p></div></div><div className={styles.actionRow}><ShieldCheck/><span><b>{fr?"Authentification à deux facteurs (2FA)":"Two-factor authentication (2FA)"}</b><small>{props.mfaEnabled?(fr?"Activée":"Enabled"):(fr?"Ajoutez une couche de sécurité.":"Add an extra security layer.")}</small></span><button onClick={()=>setMfaModalOpen(true)}>{props.mfaEnabled?(fr?"Gérer":"Manage"):(fr?"Activer":"Enable")}</button></div><div className={styles.actionRow}><LockKeyhole/><span><b>{fr?"Mot de passe":"Password"}</b><small>••••••••••••</small></span><button onClick={resetPassword}>{fr?"Modifier":"Change"}</button></div></article>
        <article className={styles.card}><div className={styles.sectionTitle}><Database/><div><h3>{fr?"Données et confidentialité":"Data and privacy"}</h3><p>{fr?"Gérez vos données personnelles.":"Manage your personal data."}</p></div></div><div className={styles.actionRow}><Download/><span><b>{fr?"Télécharger mes données":"Download my data"}</b><small>{fr?"Bientôt disponible.":"Coming soon."}</small></span><button disabled>{fr?"Télécharger":"Download"}</button></div><div className={`${styles.actionRow} ${styles.danger}`}><Trash2/><span><b>{fr?"Supprimer mon compte":"Delete my account"}</b><small>{fr?"Suppression définitive du compte.":"Permanently delete your account."}</small></span><button onClick={props.onOpenDeleteModal}>{fr?"Supprimer":"Delete"}</button></div></article></div>
      <div className={styles.saveBar}>{(saved||error)&&<span className={error?styles.error:styles.success}>{error??(fr?"Modifications enregistrées":"Changes saved")}</span>}<button id="profile-save-action" className={styles.primary} disabled={saving||!dirty} onClick={save}>{saving?<Loader2/>:<CheckCircle2/>}{saving?(fr?"Enregistrement…":"Saving…"):(fr?"Enregistrer les modifications":"Save changes")}</button></div>
    </main>
    <MfaEnrollModal open={mfaModalOpen} mfaEnabled={props.mfaEnabled} onClose={()=>setMfaModalOpen(false)} onChanged={()=>{}}/>
  </div>
}
