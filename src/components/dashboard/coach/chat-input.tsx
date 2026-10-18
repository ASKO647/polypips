"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ChevronDown, Layers3, Mic, Paperclip, Send, Square, X } from "lucide-react";
import type { QuickQuestion } from "@/lib/data/coach";
import styles from "./coach-workspace.module.css";

export function ChatInput({ value, onChange, onSend, disabled, sending, onStop }: {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onSelectSuggestion: (question: QuickQuestion) => void;
  disabled: boolean;
  sending: boolean;
  onStop: () => void;
}) {
  const t = useTranslations("Coach.ChatInput");
  const locale = useLocale();
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [modelOpen, setModelOpen] = useState(false);
  const [contextOpen, setContextOpen] = useState(false);
  const [recording, setRecording] = useState(false);
  const [file, setFile] = useState<string | null>(null);

  useEffect(() => {
    const area = areaRef.current;
    if (!area) return;
    area.style.height = "auto";
    area.style.height = `${Math.min(area.scrollHeight, 104)}px`;
  }, [value]);

  return (
    <div className={styles.composerWrap}>
      <form className={styles.composer} onSubmit={(event) => { event.preventDefault(); if (sending) onStop(); else onSend(); }}>
        {file && <div className={styles.fileCard}><Paperclip /><span>{file}<small>{locale === "en" ? "Ready" : "Prêt"}</small></span><button type="button" onClick={() => setFile(null)}><X /></button></div>}
        <textarea ref={areaRef} rows={1} value={value} onChange={(event) => onChange(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); onSend(); } }} placeholder={t("placeholder")} disabled={disabled || sending} />
        <div className={styles.composerActions}>
          <input ref={fileRef} type="file" hidden onChange={(event) => setFile(event.target.files?.[0]?.name ?? null)} />
          <button type="button" className={styles.circleButton} onClick={() => fileRef.current?.click()} aria-label={locale === "en" ? "Attach a file" : "Joindre un fichier"}><Paperclip /></button>
          <div className={styles.menuAnchor}><button type="button" className={styles.contextButton} onClick={() => setContextOpen((v) => !v)}><Layers3 />{locale === "en" ? "Add context" : "Ajouter un contexte"}<ChevronDown /></button>{contextOpen && <div className={styles.floatingMenu}><button type="button">✓ Polymarket</button><button type="button">Portefeuille</button><button type="button">{locale === "en" ? "Sports data" : "Données sportives"}</button></div>}</div>
          <div className={styles.menuAnchor}><button type="button" className={styles.modelButton} onClick={() => setModelOpen((v) => !v)}><span>P</span>Polypips Intelligence<ChevronDown /></button>{modelOpen && <div className={styles.floatingMenu}><button type="button">✓ Polypips Intelligence</button><button type="button">Polypips Fast</button></div>}</div>
          <span className={styles.actionSpacer} />
          <button type="button" className={`${styles.micButton} ${recording ? styles.recording : ""}`} onClick={() => setRecording((v) => !v)}><Mic /></button>
          <button type="submit" className={`${styles.sendButton} ${sending ? styles.stopButton : ""}`} disabled={!sending && (disabled || !value.trim())} aria-label={sending ? (locale === "en" ? "Stop" : "Arrêter") : t("sendAria")}>{sending ? <Square /> : <Send />}</button>
        </div>
      </form>
    </div>
  );
}
