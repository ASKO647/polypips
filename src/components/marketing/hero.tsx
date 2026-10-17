"use client";

import Image from "next/image";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button, ButtonIcon } from "@/components/ui/button";
import { getLandingHeaderCopy } from "./landing-header-copy";
import styles from "./landing-intro.module.css";

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m6 12 4 4 8-8" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function UniverseIcon({ kind }: { kind: "market" | "sport" | "trading" }) {
  if (kind === "sport") {
    return <span className={styles.football} aria-hidden="true">{"\u26BD"}</span>;
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {kind === "market" ? (
        <path d="M4 20V12M9 20V7M14 20V3M19 20V9" stroke="currentColor" strokeWidth="2.7" strokeLinecap="round" />
      ) : (
        <path d="m3 17 6-6 4 3 8-10m-6 0h6v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  );
}

export function Hero({ socialProofUsers = 56964 }: { socialProofUsers?: number }) {
  const locale = useLocale();
  const copy = getLandingHeaderCopy(locale);
  const count = new Intl.NumberFormat(locale).format(socialProofUsers);
  const universes = [
    { kind: "market" as const, label: "Polymarket", href: "/dashboard/analyse-ia" },
    { kind: "sport" as const, label: copy.sport, href: "/dashboard/sports" },
    { kind: "trading" as const, label: "Trading", href: "/dashboard/trading" },
  ];

  return (
    <section className={styles.hero}>
      <div className={styles.particles} aria-hidden="true" />
      <div className={styles.floatingEmojis} aria-hidden="true">
        {["⚽", "🏀", "📈", "🎾", "🏀", "⚽", "🎾", "📈"].map((emoji, index) => (
          <span className={styles.floatingEmoji} key={index}>{emoji}</span>
        ))}
      </div>
      <div className={styles.inner}>
        <div className={styles.community}>
          <span className={styles.avatars} aria-hidden="true">
            {[1, 2, 3].map((portrait) => (
              <span className={styles.avatar} key={portrait}>
                <Image
                  src={`/polypips-proof/avatar-${portrait}.png`}
                  alt=""
                  width={96}
                  height={96}
                  sizes="(max-width: 640px) 34px, 46px"
                  loading="eager"
                  className={styles.avatarImage}
                />
              </span>
            ))}
          </span>
          <span className={styles.communityText}>{copy.users.replace("{count}", count)}</span>
          <span className={styles.communityCheck}><CheckIcon /></span>
        </div>

        <p className={styles.eyebrow}>{copy.universes}</p>

        <h1 className={styles.title}>
          <span>{copy.title1}</span>
          <span>
            {copy.title2Lead}
            <em className={styles.advantage}>
              {copy.title2Accent}
              <svg className={styles.underline} viewBox="0 0 360 26" fill="none" aria-hidden="true">
                <path d="M5 21C109 1 233 1 353 10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                <path d="M40 24C148 7 259 7 340 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity=".6" />
              </svg>
            </em>
          </span>
        </h1>

        <p className={styles.description}>
          <span>{copy.description1}</span>
          <span>{copy.description2}</span>
        </p>

        <div className={styles.actions}>
          <Button href="/signup" size="lg" className={styles.heroCta}>
            <span className={styles.desktopCta}>{copy.cta}</span>
            <span className={styles.mobileCta}>{copy.shortCta}</span>
            <ButtonIcon>→</ButtonIcon>
          </Button>
        </div>
        <p className={styles.support}>{copy.support}</p>

        <div className={styles.trustpilot}>
          <Image
            src="/polypips-proof/trustpilot.svg"
            alt="Trustpilot"
            width={196}
            height={48}
            unoptimized
            className={styles.trustpilotLogo}
          />
        </div>

        <ul className={styles.benefits}>
          {copy.benefits.map((benefit) => (
            <li key={benefit}>
              <span className={styles.benefitIcon}><CheckIcon /></span>
              <span>{benefit}</span>
            </li>
          ))}
        </ul>

        <nav className={styles.universes} aria-label={copy.universeLabel}>
          {universes.map(({ kind, label, href }) => (
            <Link href={href} className={styles.universe} key={kind}>
              <UniverseIcon kind={kind} />{label}
            </Link>
          ))}
        </nav>
      </div>
    </section>
  );
}
