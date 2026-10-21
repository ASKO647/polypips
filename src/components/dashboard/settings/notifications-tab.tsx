"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { Bell, Check, CheckCircle2, Clock3, Mail, MessageSquareText, MonitorSmartphone, ShieldCheck, Smartphone } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { saveUserSettings, type UserSettings } from "@/lib/supabase/user-settings";
import styles from "./notifications-tab.module.css";

type Channel = "app" | "email" | "push" | "sms";

const channels: { id: Channel; title: string; detail: string; icon: typeof Bell; available: boolean }[] = [
  { id: "app", title: "Dans l’application", detail: "Centre de notifications Polypips", icon: Bell, available: true },
  { id: "email", title: "E-mail", detail: "Messages importants et résumés", icon: Mail, available: false },
  { id: "push", title: "Notifications push", detail: "Sur vos appareils autorisés", icon: Smartphone, available: false },
  { id: "sms", title: "SMS", detail: "Alertes urgentes uniquement", icon: MessageSquareText, available: false },
];

const groups = [
  { title: "Polymarket", rows: ["Nouvelle sélection du jour", "Variation importante du prix", "Marché bientôt clôturé"] },
  { title: "Smart Wallet", rows: ["Nouvelle position détectée", "Position fermée", "Mouvement inhabituel"] },
  { title: "Sport", rows: ["Nouvelle sélection sportive", "Changement important avant le match", "Analyse sportive terminée"] },
  { title: "Trading", rows: ["Nouvelle configuration détectée", "Analyse trading terminée", "Objectif ou niveau atteint"] },
];

function Switch({ checked, disabled = false, locked = false, label, onChange }: { checked: boolean; disabled?: boolean; locked?: boolean; label: string; onChange?: () => void }) {
  return <button type="button" role="switch" aria-checked={checked} aria-label={label} disabled={disabled || locked} onClick={onChange} className={`${styles.switch} ${checked ? styles.switchOn : ""} ${locked ? styles.switchLocked : ""}`}><i />{locked && <ShieldCheck />}</button>;
}

export function NotificationsTab({ email, initialSettings }: { email: string; initialSettings: UserSettings }) {
  const router = useRouter();
  const [appEnabled, setAppEnabled] = useState(initialSettings.notificationsAppEnabled);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = async () => {
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await saveUserSettings(supabase, user.id, { notificationsAppEnabled: appEnabled });
    }
    setSaving(false);
    setDirty(false);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 3000);
    router.refresh();
  };

  return <section className={styles.root}>
    {saved && <div className={styles.toast}><CheckCircle2 />Préférences enregistrées</div>}
    <button id="notifications-save-action" className={styles.hiddenSave} onClick={save} aria-hidden="true" tabIndex={-1} />

    <div className={styles.channelGrid}>{channels.map(({ id, title, detail, icon: Icon, available }, index) => <article className={`${styles.channelCard} ${available ? (appEnabled ? styles.channelActive : styles.channelDisabled) : styles.channelDisabled}`} style={{ "--delay": `${index * 60}ms` } as React.CSSProperties} key={id}>
      <div className={styles.channelTop}><span><Icon /></span>{available
        ? <Switch checked={appEnabled} label={`${appEnabled ? "Désactiver" : "Activer"} ${title}`} onChange={() => { setAppEnabled((value) => !value); setDirty(true); setSaved(false); }} />
        : <Switch checked={false} disabled label={title} />}</div>
      <h3>{title}</h3><p>{detail}</p>
      {available
        ? <small>{appEnabled ? <><Check />Activé{id === "email" ? ` · ${email}` : ""}</> : "Canal désactivé"}</small>
        : <em>Bientôt disponible</em>}
    </article>)}</div>

    <article className={styles.panel}>
      <div className={styles.panelHeading}><div><h2>Préférences par activité</h2><p>Choisissez précisément comment recevoir chaque type d’alerte.</p></div><span>Bientôt disponible</span></div>
      <div className={styles.tableWrap}><div className={styles.matrixHeader}><span>Activité</span>{channels.map((channel) => <b className={styles.mutedColumn} key={channel.id}>{channel.title.replace("Notifications ", "")}</b>)}</div>
      {groups.map((group) => <div className={styles.group} key={group.title}><h3>{group.title}</h3>{group.rows.map((row) => <div className={styles.preferenceRow} key={row}><span>{row}</span>{channels.map((channel) => <Switch key={channel.id} checked={false} disabled label={`${row}, ${channel.title}`} />)}</div>)}</div>)}</div>
    </article>

    <div className={styles.bottomGrid}>
      <article className={styles.panel}><div className={styles.panelHeading}><div><h2>Résumé et fréquence</h2><p>Bientôt disponible — ces réglages ne sont pas encore appliqués.</p></div><Clock3 /></div>
        <div className={styles.deviceRow}><MonitorSmartphone /><div><strong>Appareil actuel</strong><span>La gestion des appareils autorisés arrive bientôt</span></div><Switch checked={false} disabled label="Autoriser cet appareil" /></div>
      </article>
    </div>

    <div className={styles.securityNotice}><ShieldCheck /><div><strong>Alertes de sécurité critiques</strong><span>Connexion suspecte, changement de mot de passe et récupération de compte restent toujours activés.</span></div><Switch checked locked label="Alertes de sécurité toujours activées" /></div>
    <div className={styles.mobileSave}><button disabled={!dirty || saving} onClick={save}>{saving ? "Enregistrement…" : saved ? "Préférences enregistrées" : "Enregistrer les préférences"}</button></div>
  </section>;
}
