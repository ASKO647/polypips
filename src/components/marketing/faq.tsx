"use client";

import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import { useTranslations } from "next-intl";
import { ArrowRight, MessageCircle, Search, X } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { FAQ_ITEM_IDS, FAQ_CATEGORIES, FAQ_DETAILS, type FAQCategory } from "@/lib/data/faq";
import styles from "./faq.module.css";

function searchable(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase().replace(/[’']/g, " ").trim();
}

export function FAQ() {
  const t = useTranslations("FAQ");
  const uid = useId();
  const section = useRef<HTMLElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [category, setCategory] = useState<FAQCategory>("all");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<string | null>("howAiWorks");
  const [entered, setEntered] = useState(false);
  const [introDone, setIntroDone] = useState(false);
  const terms = searchable(query).split(/\s+/).filter(Boolean);
  const items = FAQ_ITEM_IDS.map((id) => ({ id, ...FAQ_DETAILS[id], question: t(`items.${id}.question`), answer: t(`items.${id}.answer`) }))
    .filter((item) => (category === "all" || item.category === category) && terms.every((term) => searchable(`${item.question} ${item.answer}`).includes(term)));

  useEffect(() => {
    const element = section.current;
    if (!element) return;
    if (typeof IntersectionObserver !== "function") {
      const frame = requestAnimationFrame(() => setEntered(true));
      return () => cancelAnimationFrame(frame);
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setEntered(true); observer.disconnect(); }
    }, { rootMargin: "0px 0px -30px 0px", threshold: 0 });
    observer.observe(element.querySelector("h2") ?? element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!entered || introDone) return;
    const timer = setTimeout(() => setIntroDone(true), 1000);
    return () => clearTimeout(timer);
  }, [entered, introDone]);

  function chooseCategory(value: FAQCategory) { setCategory(value); setOpen(null); setIntroDone(true); }
  function clearSearch() { setQuery(""); setCategory("all"); setIntroDone(true); input.current?.focus(); }

  return <section id="faq" ref={section} className={styles.section} data-entered={entered} data-intro-done={introDone} aria-labelledby={`${uid}-title`}>
    <div className={styles.layout}>
      <div className={styles.introduction}>
        <p className={styles.eyebrow}><span aria-hidden="true" />{t("eyebrow")}</p>
        <h2 id={`${uid}-title`}>{t("title")}<br /><span>{t("titleAccent")}</span></h2>
        <p className={styles.description}>{t("description")}</p>
        <div className={styles.contact}>
          <span className={styles.contactIcon}><MessageCircle aria-hidden="true" /></span>
          <div><h3>{t("contactTitle")}</h3><p>{t("contactDescription")}</p><Link href="/contact" className={styles.textLink}>{t("contactLink")}<ArrowRight aria-hidden="true" /></Link></div>
        </div>
        <Link href="/signup" className={styles.cta}>{t("cta")}<ArrowRight aria-hidden="true" /></Link>
      </div>
      <div className={styles.questions}>
        <div className={styles.searchBox}>
          <Search aria-hidden="true" />
          <label className={styles.srOnly} htmlFor={`${uid}-search`}>{t("searchLabel")}</label>
          <input ref={input} id={`${uid}-search`} type="search" value={query} placeholder={t("searchPlaceholder")} onChange={(event) => { setQuery(event.target.value); setIntroDone(true); }} aria-controls={`${uid}-results`} autoComplete="off" />
          {query && <button type="button" onClick={() => { setQuery(""); input.current?.focus(); }} aria-label={t("clearSearch")}><X aria-hidden="true" /></button>}
        </div>
        <div className={styles.categories} role="group" aria-label={t("categoryLabel")} style={{ "--active": FAQ_CATEGORIES.indexOf(category) } as CSSProperties}>
          <span className={styles.capsule} aria-hidden="true" />
          {FAQ_CATEGORIES.map((value) => <button type="button" key={value} aria-pressed={category === value} onClick={() => chooseCategory(value)} aria-controls={`${uid}-results`}>{t(`categories.${value}`)}</button>)}
        </div>
        <p className={styles.srOnly} role="status" aria-live="polite" aria-atomic="true">{t("resultCount", { count: items.length })}</p>
        <div id={`${uid}-results`} className={styles.results} key={`${category}:${searchable(query)}`}>
          {items.length ? items.map((item, index) => {
            const expanded = open === item.id;
            const triggerId = `${uid}-${item.id}-trigger`;
            const answerId = `${uid}-${item.id}-answer`;
            return <div className={styles.questionReveal} key={item.id} style={{ "--delay": `${index * 60}ms` } as CSSProperties}>
              <article className={styles.card} data-open={expanded}>
                <h3 className={styles.questionTitle}><button type="button" id={triggerId} aria-expanded={expanded} aria-controls={answerId} onClick={() => setOpen(expanded ? null : item.id)} className={styles.trigger}><span>{item.question}</span><span className={styles.plus} aria-hidden="true"><i /><i /></span></button></h3>
                <div className={styles.answerGrid} id={answerId} role="region" aria-labelledby={triggerId} aria-hidden={!expanded} inert={!expanded}>
                  <div className={styles.answerClip}><div className={styles.answerText}><p>{item.answer}</p><Link href={item.href} className={styles.textLink}>{t(`answerLinks.${item.link}`)}<ArrowRight aria-hidden="true" /></Link></div></div>
                </div>
              </article>
            </div>;
          }) : <div className={styles.empty}><Search aria-hidden="true" /><h3>{t("emptyTitle")}</h3><p>{t("emptyDescription")}</p><button type="button" className={styles.textLink} onClick={clearSearch}>{t("reset")}<ArrowRight aria-hidden="true" /></button></div>}
        </div>
      </div>
    </div>
  </section>;
}
