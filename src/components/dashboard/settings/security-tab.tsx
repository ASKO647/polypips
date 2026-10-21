"use client";

import { useMemo, useState } from "react";
import { useLocale } from "next-intl";
import {
  AlertTriangle,
  Bell,
  Check,
  CheckCircle2,
  Clock3,
  Eye,
  EyeOff,
  KeyRound,
  Laptop,
  Loader2,
  LockKeyhole,
  Mail,
  MapPin,
  MonitorSmartphone,
  ShieldCheck,
  Smartphone,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { MfaEnrollModal } from "@/components/dashboard/settings/mfa-enroll-modal";
import styles from "./security-tab.module.css";

type Modal = "password" | "passkey" | "sessions" | "suspicious" | null;

export function SecurityTab({ email, mfaEnabled }: { email: string; mfaEnabled: boolean }) {
  const locale = useLocale();
  const fr = locale === "fr";
  const [modal, setModal] = useState<Modal>(null);
  const [mfaModalOpen, setMfaModalOpen] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [disconnectOthers, setDisconnectOthers] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [sessionsPassword, setSessionsPassword] = useState("");
  const [sessionsError, setSessionsError] = useState<string | null>(null);
  const [sessionsSubmitting, setSessionsSubmitting] = useState(false);

  const rules = useMemo(() => [
    { label: fr ? "8 caractères minimum" : "At least 8 characters", ok: password.length >= 8 },
    { label: fr ? "Une majuscule et une minuscule" : "Upper and lower case", ok: /[a-z]/.test(password) && /[A-Z]/.test(password) },
    { label: fr ? "Un chiffre et un caractère spécial" : "A number and special character", ok: /\d/.test(password) && /[^A-Za-z0-9]/.test(password) },
    { label: fr ? "Les mots de passe correspondent" : "Passwords match", ok: password.length > 0 && password === confirmPassword },
  ], [confirmPassword, fr, password]);
  const strength = Math.round((rules.filter((rule) => rule.ok).length / rules.length) * 100);
  const score = mfaEnabled ? 95 : 78;

  const notify = (text: string) => {
    setToast(text);
    window.setTimeout(() => setToast(null), 3000);
  };

  const savePassword = async () => {
    if (!rules.every((rule) => rule.ok)) return;
    setSaving(true);
    setMessage(null);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setMessage(error.message);
      setSaving(false);
      return;
    }
    if (disconnectOthers) {
      await supabase.auth.signOut({ scope: "others" });
    }
    setSaving(false);
    setMessage(fr ? "Mot de passe modifié avec succès." : "Password updated successfully.");
    notify(fr ? "Modifications enregistrées" : "Changes saved");
    window.setTimeout(() => setModal(null), 900);
  };

  const browserLabel = typeof navigator === "undefined"
    ? (fr ? "Navigateur actuel" : "Current browser")
    : navigator.userAgent.includes("Edg") ? "Microsoft Edge" : navigator.userAgent.includes("Firefox") ? "Firefox" : navigator.userAgent.includes("Chrome") ? "Chrome" : navigator.userAgent.includes("Safari") ? "Safari" : (fr ? "Navigateur actuel" : "Current browser");

  return <section className={styles.root}>
    {toast && <div className={styles.toast}><CheckCircle2 />{toast}</div>}

    <article className={styles.scoreCard}>
      <div className={styles.scoreIcon}><ShieldCheck /></div>
      <div className={styles.scoreCopy}><span>{fr ? "Score de sécurité" : "Security score"}</span><div><strong>{score}</strong><b>/ 100 — {score >= 90 ? (fr ? "Excellent" : "Excellent") : (fr ? "Bon niveau" : "Good level")}</b></div></div>
      <div className={styles.scoreTrack}><i style={{ "--score": `${score}%` } as React.CSSProperties} /></div>
      <div className={styles.scoreTip}><span>💡</span><p>{mfaEnabled ? (fr ? "Votre compte bénéficie d’une protection renforcée." : "Your account has enhanced protection.") : (fr ? "Activez la double authentification pour renforcer votre compte." : "Enable two-factor authentication to strengthen your account.")}</p></div>
    </article>

    <div className={styles.grid}>
      <article className={styles.card} style={{ "--delay": "0ms" } as React.CSSProperties}>
        <div className={styles.cardHeading}><span><LockKeyhole /></span><div><h3>{fr ? "Mot de passe" : "Password"}</h3><p>{fr ? "Protégez l’accès à votre compte Polypips." : "Protect access to your Polypips account."}</p></div></div>
        <div className={styles.passwordPreview}><b>••••••••••••</b><button aria-label={fr ? "Afficher" : "Show"}>{passwordVisible ? <EyeOff /> : <Eye />}</button><span><i />{fr ? "Fort" : "Strong"}</span></div>
        <button className={styles.outlineButton} onClick={() => setModal("password")}>{fr ? "Modifier le mot de passe" : "Change password"}</button>
      </article>

      <article className={styles.card} style={{ "--delay": "60ms" } as React.CSSProperties}>
        <div className={styles.cardHeading}><span><ShieldCheck /></span><div><div className={styles.titleLine}><h3>{fr ? "Authentification à deux facteurs (2FA)" : "Two-factor authentication (2FA)"}</h3><em className={mfaEnabled ? styles.enabled : styles.disabled}>{mfaEnabled ? (fr ? "Activée" : "Enabled") : (fr ? "Non activée" : "Not enabled")}</em></div><p>{fr ? "Ajoutez une couche de sécurité supplémentaire à votre compte." : "Add an extra layer of security to your account."}</p></div></div>
        <div className={styles.twoFactor}><button className={styles.primaryButton} onClick={() => setMfaModalOpen(true)}>{mfaEnabled ? (fr ? "Gérer la 2FA" : "Manage 2FA") : (fr ? "Activer la 2FA" : "Enable 2FA")}</button><div><span><Smartphone /> <b>{fr ? "Application d’authentification" : "Authenticator app"}</b></span></div></div>
      </article>

      <article className={styles.card} style={{ "--delay": "120ms" } as React.CSSProperties}>
        <div className={styles.cardHeading}><span><KeyRound /></span><div><h3>{fr ? "Clés d’accès" : "Passkeys"}</h3><p>{fr ? "Face ID, empreinte ou Windows Hello, sans mot de passe." : "Face ID, fingerprint or Windows Hello, without a password."}</p></div></div>
        <div className={styles.passkeyRow}><div><strong>0</strong><span>{fr ? "clé d’accès enregistrée" : "passkey registered"}</span></div><button className={styles.outlineButton} onClick={() => setModal("passkey")}>{fr ? "Ajouter une clé d’accès" : "Add a passkey"}</button></div>
      </article>

      <article className={styles.card} style={{ "--delay": "180ms" } as React.CSSProperties}>
        <div className={styles.cardHeading}><span><Bell /></span><div><h3>{fr ? "Alertes de sécurité" : "Security alerts"}</h3><p>{fr ? "Recevez des notifications lors d’une activité importante." : "Get notified about important account activity."}</p></div></div>
        <div className={styles.alertGrid}><div>{[
          [fr ? "Nouvelle connexion" : "New sign-in", fr ? "Nouvel appareil détecté" : "New device detected"],
          [fr ? "Changement du mot de passe" : "Password change", fr ? "Confirmation immédiate" : "Immediate confirmation"],
          [fr ? "Activité inhabituelle" : "Unusual activity", fr ? "Alerte en cas d’activité suspecte" : "Alert for suspicious activity"],
        ].map(([title, subtitle]) => <div className={styles.alertRow} key={title}><div><AlertTriangle /><span><b>{title}</b><small>{subtitle}</small></span></div><span className={styles.alwaysOn}><ShieldCheck />{fr ? "Toujours actif" : "Always on"}</span></div>)}</div><aside><Mail /><b>Email</b><span>{email}</span></aside></div>
      </article>
    </div>

    <article className={`${styles.card} ${styles.sessions}`} style={{ "--delay": "240ms" } as React.CSSProperties}>
      <div className={styles.sectionHeader}><div className={styles.cardHeading}><span><MonitorSmartphone /></span><div><h3>{fr ? "Sessions et appareils actifs" : "Active sessions and devices"}</h3><p>{fr ? "Les sessions détaillées nécessitent une source serveur sécurisée." : "Detailed sessions require a secure server-side source."}</p></div></div><button className={styles.outlineButton} onClick={() => setModal("sessions")}>{fr ? "Déconnecter les autres appareils" : "Sign out other devices"}</button></div>
      <div className={styles.sessionTable}><div className={styles.tableHead}><span>{fr ? "Appareil" : "Device"}</span><span>{fr ? "Navigateur" : "Browser"}</span><span>{fr ? "Localisation" : "Location"}</span><span>{fr ? "Dernière activité" : "Last activity"}</span><span>{fr ? "Statut" : "Status"}</span></div><div className={styles.deviceRow}><span><Laptop /><b>{fr ? "Cet appareil" : "This device"}</b></span><span>{browserLabel}</span><span><MapPin />{fr ? "Session actuelle" : "Current session"}</span><span>{fr ? "À l’instant" : "Just now"}</span><em>{fr ? "Session actuelle" : "Current session"}</em></div></div>
    </article>

    <article className={`${styles.card} ${styles.history}`} style={{ "--delay": "300ms" } as React.CSSProperties}>
      <div className={styles.sectionHeader}><div className={styles.cardHeading}><span><Clock3 /></span><div><h3>{fr ? "Historique de connexion" : "Sign-in history"}</h3><p>{fr ? "Les événements réels seront affichés lorsque le journal serveur sera disponible." : "Real events will appear when the server log is available."}</p></div></div><button className={styles.outlineButton} onClick={() => notify(fr ? "Aucun historique supplémentaire disponible" : "No additional history available")}>{fr ? "Voir tout l’historique" : "View all history"}</button></div>
      <div className={styles.emptyHistory}><Clock3 /><span>{fr ? "Aucun événement de connexion fourni par le backend actuel." : "No sign-in events are provided by the current backend."}</span></div>
    </article>

    <article className={`${styles.card} ${styles.suspicious}`} style={{ "--delay": "360ms" } as React.CSSProperties}>
      <AlertTriangle /><div><h3>{fr ? "Vous pensez que votre compte est compromis ?" : "Think your account is compromised?"}</h3><p>{fr ? "Modifiez immédiatement votre mot de passe et fermez les autres sessions." : "Immediately change your password and close other sessions."}</p></div><button onClick={() => setModal("suspicious")}>{fr ? "Ce n’était pas moi" : "That wasn't me"}</button>
    </article>

    <MfaEnrollModal open={mfaModalOpen} mfaEnabled={mfaEnabled} onClose={() => setMfaModalOpen(false)} onChanged={() => {}} />

    {modal && <div className={styles.overlay} onMouseDown={(event) => event.target === event.currentTarget && setModal(null)}>
      <div className={styles.modal} role="dialog" aria-modal="true"><button className={styles.close} onClick={() => { setModal(null); setSessionsPassword(""); setSessionsError(null); }}><X /></button>
        {modal === "password" && <><div className={styles.modalIcon}><LockKeyhole /></div><h2>{fr ? "Modifier le mot de passe" : "Change password"}</h2><p>{fr ? "Choisissez un mot de passe unique et difficile à deviner." : "Choose a unique password that is hard to guess."}</p><label>{fr ? "Nouveau mot de passe" : "New password"}<div className={styles.inputWrap}><input type={passwordVisible ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password"/><button onClick={() => setPasswordVisible((value) => !value)}>{passwordVisible ? <EyeOff /> : <Eye />}</button></div></label><label>{fr ? "Confirmer le mot de passe" : "Confirm password"}<input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password"/></label><div className={styles.strength}><div><i style={{ width: `${strength}%` }}/></div><span>{strength}%</span></div><ul className={styles.rules}>{rules.map((rule) => <li className={rule.ok ? styles.ruleOk : ""} key={rule.label}><Check />{rule.label}</li>)}</ul><label className={styles.checkbox}><input type="checkbox" checked={disconnectOthers} onChange={(event) => setDisconnectOthers(event.target.checked)}/><span>{fr ? "Déconnecter automatiquement les autres appareils" : "Automatically sign out other devices"}</span></label>{message && <div className={styles.formMessage}>{message}</div>}<button className={styles.primaryButton} disabled={saving || !rules.every((rule) => rule.ok)} onClick={savePassword}>{saving ? <><Loader2 className={styles.spinner}/>{fr ? "Enregistrement…" : "Saving…"}</> : (fr ? "Enregistrer le nouveau mot de passe" : "Save new password")}</button></>}
        {modal === "passkey" && <><div className={`${styles.modalIcon} ${styles.keyWave}`}><KeyRound /></div><h2>{fr ? "Ajouter une clé d’accès" : "Add a passkey"}</h2><p>{fr ? "L’enregistrement WebAuthn n’est pas encore relié au backend Polypips. Aucune clé ne sera créée depuis cette fenêtre." : "WebAuthn registration is not connected to the Polypips backend yet. No key will be created from this dialog."}</p><button className={styles.primaryButton} onClick={() => setModal(null)}>{fr ? "J’ai compris" : "Understood"}</button></>}
        {modal === "sessions" && <><div className={styles.modalIcon}><MonitorSmartphone /></div><h2>{fr ? "Déconnecter les autres appareils" : "Sign out other devices"}</h2><p>{fr ? "Confirmez avec votre mot de passe. Les autres sessions actives seront fermées." : "Confirm with your password. Other active sessions will be closed."}</p><label>{fr ? "Mot de passe actuel" : "Current password"}<input type="password" autoComplete="current-password" value={sessionsPassword} onChange={(event) => { setSessionsPassword(event.target.value); setSessionsError(null); }}/></label>{sessionsError && <p className={styles.formMessage} style={{ color: "#d51a36" }}>{sessionsError}</p>}<button className={styles.primaryButton} disabled={!sessionsPassword || sessionsSubmitting} onClick={async () => { setSessionsSubmitting(true); setSessionsError(null); const supabase = createClient(); const { error } = await supabase.auth.signInWithPassword({ email, password: sessionsPassword }); if (error) { setSessionsError(fr ? "Mot de passe incorrect." : "Incorrect password."); setSessionsSubmitting(false); return; } await supabase.auth.signOut({ scope: "others" }); setSessionsSubmitting(false); setSessionsPassword(""); setModal(null); notify(fr ? "Autres appareils déconnectés" : "Other devices signed out"); }}>{sessionsSubmitting ? <Loader2 className={styles.spinner} /> : null}{fr ? "Confirmer la déconnexion" : "Confirm sign out"}</button></>}
        {modal === "suspicious" && <><div className={styles.modalIcon}><AlertTriangle /></div><h2>{fr ? "Sécuriser immédiatement le compte" : "Secure account now"}</h2><p>{fr ? "Commencez par modifier votre mot de passe. L’option de déconnexion des autres appareils sera activée automatiquement." : "Start by changing your password. Signing out other devices will be enabled automatically."}</p><button className={styles.primaryButton} onClick={() => { setDisconnectOthers(true); setModal("password"); }}>{fr ? "Modifier mon mot de passe" : "Change my password"}</button></>}
      </div>
    </div>}
  </section>;
}
