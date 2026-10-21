"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell, Check, CheckCircle2, Clock3, Mail, MessageSquareText, MonitorSmartphone, ShieldCheck, Smartphone } from "lucide-react";
import styles from "./notifications-tab.module.css";

type Channel = "app" | "email" | "push" | "sms";
type Frequency = "instant" | "daily" | "weekly";
type Preferences = Record<string, Record<Channel, boolean>>;

const channels: { id: Channel; title: string; detail: string; icon: typeof Bell }[] = [
  { id: "app", title: "Dans l’application", detail: "Centre de notifications Polypips", icon: Bell },
  { id: "email", title: "E-mail", detail: "Messages importants et résumés", icon: Mail },
  { id: "push", title: "Notifications push", detail: "Sur vos appareils autorisés", icon: Smartphone },
  { id: "sms", title: "SMS", detail: "Alertes urgentes uniquement", icon: MessageSquareText },
];

const groups = [
  { title: "Polymarket", rows: ["Nouvelle sélection du jour", "Variation importante du prix", "Marché bientôt clôturé"] },
  { title: "Smart Wallet", rows: ["Nouvelle position détectée", "Position fermée", "Mouvement inhabituel"] },
  { title: "Sport", rows: ["Nouvelle sélection sportive", "Changement important avant le match", "Analyse sportive terminée"] },
  { title: "Trading", rows: ["Nouvelle configuration détectée", "Analyse trading terminée", "Objectif ou niveau atteint"] },
];

const coachRows = ["Réponse du Coach IA disponible", "Nouveau rapport personnalisé", "Mention dans la communauté", "Réponse à une discussion"];
const storageKey = "polypips-notification-preferences-v1";

function createPreferences(): Preferences {
  return Object.fromEntries(groups.flatMap((group) => group.rows).map((row) => [row, { app: true, email: true, push: true, sms: false }]));
}

function Switch({ checked, disabled = false, locked = false, label, onChange }: { checked: boolean; disabled?: boolean; locked?: boolean; label: string; onChange?: () => void }) {
  return <button type="button" role="switch" aria-checked={checked} aria-label={label} disabled={disabled || locked} onClick={onChange} className={`${styles.switch} ${checked ? styles.switchOn : ""} ${locked ? styles.switchLocked : ""}`}><i />{locked && <ShieldCheck />}</button>;
}

export function NotificationsTab({ email }: { email: string }) {
  const [enabled, setEnabled] = useState<Record<Channel, boolean>>({ app: true, email: true, push: true, sms: false });
  const [preferences, setPreferences] = useState<Preferences>(createPreferences);
  const [coach, setCoach] = useState<Record<string, boolean>>(() => Object.fromEntries(coachRows.map((row) => [row, true])));
  const [frequency, setFrequency] = useState<Frequency>("instant");
  const [quiet, setQuiet] = useState(false);
  const [quietFrom, setQuietFrom] = useState("22:00");
  const [quietTo, setQuietTo] = useState("07:00");
  const [deviceAllowed, setDeviceAllowed] = useState(true);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (!stored) return;
      const value = JSON.parse(stored);
      if (value.enabled) setEnabled(value.enabled);
      if (value.preferences) setPreferences(value.preferences);
      if (value.coach) setCoach(value.coach);
      if (value.frequency) setFrequency(value.frequency);
      if (typeof value.quiet === "boolean") setQuiet(value.quiet);
      if (value.quietFrom) setQuietFrom(value.quietFrom);
      if (value.quietTo) setQuietTo(value.quietTo);
      if (typeof value.deviceAllowed === "boolean") setDeviceAllowed(value.deviceAllowed);
    } catch { /* Ignore malformed local settings. */ }
  }, []);

  const summary = useMemo(() => frequency === "instant" ? "Recevez les alertes dès qu’un événement important se produit." : frequency === "daily" ? "Un résumé quotidien regroupera vos notifications non urgentes." : "Un résumé hebdomadaire regroupera vos notifications non urgentes.", [frequency]);
  const change = (action: () => void) => { action(); setDirty(true); setSaved(false); };
  const save = () => {
    setSaving(true);
    window.setTimeout(() => {
      localStorage.setItem(storageKey, JSON.stringify({ enabled, preferences, coach, frequency, quiet, quietFrom, quietTo, deviceAllowed }));
      setSaving(false); setDirty(false); setSaved(true);
      window.setTimeout(() => setSaved(false), 3000);
    }, 450);
  };

  return <section className={styles.root}>
    {saved && <div className={styles.toast}><CheckCircle2 />Préférences enregistrées</div>}
    <button id="notifications-save-action" className={styles.hiddenSave} onClick={save} aria-hidden="true" tabIndex={-1} />

    <div className={styles.channelGrid}>{channels.map(({ id, title, detail, icon: Icon }, index) => <article className={`${styles.channelCard} ${enabled[id] ? styles.channelActive : styles.channelDisabled}`} style={{ "--delay": `${index * 60}ms` } as React.CSSProperties} key={id}>
      <div className={styles.channelTop}><span><Icon /></span><Switch checked={enabled[id]} label={`${enabled[id] ? "Désactiver" : "Activer"} ${title}`} onChange={() => change(() => setEnabled((current) => ({ ...current, [id]: !current[id] })))} /></div>
      <h3>{title}</h3><p>{detail}</p>
      <small>{enabled[id] ? <><Check />Activé{id === "email" ? ` · ${email}` : id === "push" ? " · 1 appareil" : ""}</> : "Canal désactivé"}</small>
      {!enabled[id] && <em>Activez ce canal pour modifier ses réglages.</em>}
    </article>)}</div>

    <article className={styles.panel}>
      <div className={styles.panelHeading}><div><h2>Préférences par activité</h2><p>Choisissez précisément comment recevoir chaque type d’alerte.</p></div><span>Alertes personnalisées</span></div>
      <div className={styles.tableWrap}><div className={styles.matrixHeader}><span>Activité</span>{channels.map((channel) => <b className={!enabled[channel.id] ? styles.mutedColumn : ""} key={channel.id}>{channel.title.replace("Notifications ", "")}</b>)}</div>
      {groups.map((group) => <div className={styles.group} key={group.title}><h3>{group.title}</h3>{group.rows.map((row) => <div className={styles.preferenceRow} key={row}><span>{row}</span>{channels.map((channel) => <Switch key={channel.id} checked={enabled[channel.id] && preferences[row][channel.id]} disabled={!enabled[channel.id]} label={`${row}, ${channel.title}`} onChange={() => change(() => setPreferences((current) => ({ ...current, [row]: { ...current[row], [channel.id]: !current[row][channel.id] } })))} />)}</div>)}</div>)}</div>
    </article>

    <div className={styles.bottomGrid}>
      <article className={styles.panel}><div className={styles.panelHeading}><div><h2>Coach IA et communauté</h2><p>Gardez le contrôle sur les messages et les échanges.</p></div><Bell /></div><div className={styles.simpleList}>{coachRows.map((row) => <div key={row}><span>{row}</span><Switch checked={coach[row]} label={row} onChange={() => change(() => setCoach((current) => ({ ...current, [row]: !current[row] })))} /></div>)}</div></article>
      <article className={styles.panel}><div className={styles.panelHeading}><div><h2>Résumé et fréquence</h2><p>Décidez quand Polypips peut vous contacter.</p></div><Clock3 /></div><div className={styles.frequency}>{([['instant','Immédiatement'],['daily','Résumé quotidien'],['weekly','Résumé hebdomadaire']] as const).map(([value,label]) => <button className={frequency === value ? styles.frequencyActive : ""} key={value} onClick={() => change(() => setFrequency(value))}><i />{label}</button>)}</div><p className={styles.frequencyCopy}>{summary}</p>
        <div className={styles.quietRow}><div><strong>Ne pas déranger</strong><span>Les alertes critiques de sécurité restent actives.</span></div><Switch checked={quiet} label="Ne pas déranger" onChange={() => change(() => setQuiet((value) => !value))} /></div>
        {quiet && <div className={styles.quietTimes}><label>De<input type="time" value={quietFrom} onChange={(event) => change(() => setQuietFrom(event.target.value))}/></label><label>À<input type="time" value={quietTo} onChange={(event) => change(() => setQuietTo(event.target.value))}/></label><p>Notifications silencieuses de {quietFrom.replace(":", " h ")} à {quietTo.replace(":", " h ")}.</p></div>}
        <div className={styles.deviceRow}><MonitorSmartphone /><div><strong>Appareil actuel</strong><span>Autorisé à recevoir les notifications push</span></div><Switch checked={deviceAllowed} disabled={!enabled.push} label="Autoriser cet appareil" onChange={() => change(() => setDeviceAllowed((value) => !value))} /></div>
      </article>
    </div>

    <div className={styles.securityNotice}><ShieldCheck /><div><strong>Alertes de sécurité critiques</strong><span>Connexion suspecte, changement de mot de passe et récupération de compte restent toujours activés.</span></div><Switch checked locked label="Alertes de sécurité toujours activées" /></div>
    <div className={styles.mobileSave}><button disabled={!dirty || saving} onClick={save}>{saving ? "Enregistrement…" : saved ? "Préférences enregistrées" : "Enregistrer les préférences"}</button></div>
  </section>;
}
