"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import Image from "next/image";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { proofCaptures, proofRows, type ProofCapture } from "./proof-gallery-data";
import { getProofGalleryCopy } from "./proof-gallery-copy";
import styles from "./proof-gallery.module.css";

type GlyphName = "arrow" | "expand" | "close" | "left" | "right" | "pause" | "play" | "plus" | "fit";
const glyphs: Record<GlyphName, ReactNode> = {
  arrow: <path d="M4 12h16m-6-6 6 6-6 6" />,
  expand: <path d="M9 4H4v5m11-5h5v5M4 15v5h5m11-5v5h-5" />,
  close: <path d="m6 6 12 12M6 18 18 6" />,
  left: <path d="m15 5-7 7 7 7" />,
  right: <path d="m9 5 7 7-7 7" />,
  pause: <path d="M8 5v14m8-14v14" />,
  play: <path d="m8 4 12 8-12 8V4Z" />,
  plus: <><circle cx="10" cy="10" r="6" /><path d="m15 15 6 6M7 10h6m-3-3v6" /></>,
  fit: <path d="M3 8h5V3m13 5h-5V3M3 16h5v5m13-5h-5v5" />,
};
function Glyph({ name, className }: { name: GlyphName; className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{glyphs[name]}</svg>;
}

function subscribeMotion(callback: () => void) {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}
function readMotion() { return window.matchMedia("(prefers-reduced-motion: reduce)").matches; }
function serverMotion() { return true; }
function subscribeVisibility(callback: () => void) {
  document.addEventListener("visibilitychange", callback);
  return () => document.removeEventListener("visibilitychange", callback);
}
function readVisibility() { return !document.hidden; }
function serverVisibility() { return false; }

export function ProofShowcase() {
  const locale = useLocale();
  const language = locale === "en" ? "en" : "fr";
  const copy = getProofGalleryCopy(locale);
  const [paused, setPaused] = useState(false);
  const [inView, setInView] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [zoomed, setZoomed] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const imageBodyRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useSyncExternalStore(subscribeMotion, readMotion, serverMotion);
  const pageVisible = useSyncExternalStore(subscribeVisibility, readVisibility, serverVisibility);
  const isOpen = selected !== null;
  const activeCapture = selected === null ? null : proofCaptures[selected];
  const moving = inView && pageVisible && !paused && !isOpen && !reducedMotion;

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    if (typeof IntersectionObserver !== "function") {
      const frame = window.requestAnimationFrame(() => setInView(true));
      return () => window.cancelAnimationFrame(frame);
    }
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.02 });
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) dialog.showModal();
    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [isOpen]);

  useEffect(() => {
    if (imageBodyRef.current) imageBodyRef.current.scrollTop = 0;
  }, [selected]);

  function openCapture(index: number) {
    setZoomed(false);
    setSelected(index);
  }
  function closeGallery() {
    setSelected(null);
    setZoomed(false);
  }
  function navigate(direction: number) {
    setZoomed(false);
    setSelected((previous) => ((previous ?? 0) + direction + proofCaptures.length) % proofCaptures.length);
  }
  function card(capture: ProofCapture, duplicate: boolean) {
    const title = capture.label[language];
    const status = copy.status[capture.status];
    const index = proofCaptures.findIndex((item) => item.id === capture.id);
    return (
      <button
        type="button"
        className={styles.card}
        key={capture.id}
        tabIndex={duplicate ? -1 : 0}
        aria-label={`${copy.enlarge} : ${title} — ${status}`}
        onClick={() => openCapture(index)}
      >
        <span className={styles.frame}>
          <Image src={capture.src} alt={duplicate ? "" : `${title} — ${status}`} fill sizes="(max-width: 640px) 248px, 312px" loading="lazy" className={styles.thumbnail} style={{ objectPosition: `50% ${capture.focusY}%` }} />
          <span className={styles.kind}>{capture.kind === "sport" ? copy.sport : copy.trading}</span>
          <span className={styles.expandIcon}><Glyph name="expand" /></span>
        </span>
        <span className={styles.cardFooter}><span><strong>{title}</strong><small>{status}</small></span><Glyph name="arrow" className={styles.cardArrow} /></span>
      </button>
    );
  }

  return (
    <section id="preuves" ref={sectionRef} className={styles.section} aria-labelledby="proof-gallery-title" data-moving={moving}>
      <header className={styles.heading}>
        <p className={styles.eyebrow}><span />{copy.eyebrow}</p>
        <h2 id="proof-gallery-title">{copy.title} <span>{copy.accent}</span></h2>
        <p className={styles.description}>{copy.description}</p>
      </header>

      <div className={styles.controls}>
        <span className={styles.count}><span />{copy.count}</span>
        <div><button type="button" className={styles.controlButton} disabled={reducedMotion} aria-pressed={paused} onClick={() => setPaused((value) => !value)}><Glyph name={paused ? "play" : "pause"} />{reducedMotion ? copy.manual : paused ? copy.resume : copy.pause}</button><button type="button" className={styles.controlButton} onClick={() => openCapture(0)}><Glyph name="expand" />{copy.gallery}</button></div>
      </div>

      <div className={styles.wall}>
        {proofRows.map((ids, row) => (
          <div className={styles.row} data-direction={row === 1 ? "right" : "left"} key={row} role="group" aria-label={`${copy.row} ${row + 1}`}>
            <div className={styles.track}>
              {[false, true].map((duplicate) => <div className={`${styles.group} ${duplicate ? styles.clone : ""}`} aria-hidden={duplicate ? true : undefined} key={String(duplicate)}>{ids.map((id) => card(proofCaptures.find((capture) => capture.id === id)!, duplicate))}</div>)}
            </div>
          </div>
        ))}
      </div>

      <p className={styles.note}>{copy.note}</p>
      <div className={styles.ctaArea}><Link href="/signup" className={styles.primaryCta}>{copy.cta}<Glyph name="arrow" /></Link><p>{copy.support}</p></div>

      <dialog
        ref={dialogRef}
        className={styles.dialog}
        aria-labelledby="proof-dialog-title"
        onCancel={(event) => { event.preventDefault(); closeGallery(); }}
        onClose={() => setSelected(null)}
        onClick={(event) => { if (event.target === event.currentTarget) closeGallery(); }}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft") { event.preventDefault(); navigate(-1); }
          if (event.key === "ArrowRight") { event.preventDefault(); navigate(1); }
        }}
      >
        <div className={styles.dialogShell}>
          <header className={styles.dialogHeader}><div><h3 id="proof-dialog-title">{activeCapture?.label[language] ?? copy.gallery}</h3><p>{activeCapture ? copy.status[activeCapture.status] : ""}</p></div><span className={styles.counter} aria-live="polite">{selected === null ? 0 : selected + 1} / {proofCaptures.length}</span><button type="button" className={styles.iconButton} aria-label={copy.close} onClick={closeGallery}><Glyph name="close" /></button></header>
          <div ref={imageBodyRef} className={`${styles.imageBody} ${zoomed ? styles.zoomed : ""}`}>
            {activeCapture && <Image src={activeCapture.src} alt={`${activeCapture.label[language]} — ${copy.status[activeCapture.status]}`} width={activeCapture.width} height={activeCapture.height} unoptimized loading="eager" className={styles.fullImage} />}
          </div>
          <footer className={styles.dialogFooter}><div><button type="button" className={styles.iconButton} aria-label={copy.previous} onClick={() => navigate(-1)}><Glyph name="left" /></button><button type="button" className={styles.iconButton} aria-label={copy.next} onClick={() => navigate(1)}><Glyph name="right" /></button></div><button type="button" className={styles.zoomButton} aria-pressed={zoomed} onClick={() => setZoomed((value) => !value)}><Glyph name={zoomed ? "fit" : "plus"} />{zoomed ? copy.fit : copy.zoom}</button>{activeCapture && <a href={activeCapture.src} target="_blank" rel="noopener noreferrer" className={styles.originalLink}>{copy.original}</a>}</footer>
        </div>
      </dialog>
    </section>
  );
}
