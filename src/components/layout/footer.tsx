import Image from "next/image";
import { useTranslations } from "next-intl";
import { ArrowUpRight, Check } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Logo } from "@/components/ui/logo";
import { FOOTER_COLUMNS, SOCIAL_LINKS } from "@/lib/data/nav";
import styles from "./footer.module.css";

export function Footer({ landing = false }: { landing?: boolean }) {
  const t = useTranslations("Footer");

  return (
    <footer className={styles.footer}>
      {landing && (
        <div className={styles.conversion}>
          <div className={styles.socialProof}>
            <span>{t("activeUsers", { count: 56964 })}</span>
            <span className={styles.avatars} aria-hidden="true">
              {[1, 2, 3].map((portrait) => (
                <span key={portrait}>
                  <Image src={`/polypips-proof/avatar-${portrait}.png`} alt="" width={52} height={52} />
                </span>
              ))}
            </span>
          </div>
          <h2>{t("conversionTitle")}</h2>
          <Link href="/signup" className={styles.primaryCta}>
            <span>{t("cta")}</span>
            <span className={styles.ctaArrow}><ArrowUpRight aria-hidden="true" /></span>
          </Link>
          <ul className={styles.assurances}>
            {[t("arg1"), t("arg2"), t("arg3")].map((argument) => (
              <li key={argument}><span><Check aria-hidden="true" /></span>{argument}</li>
            ))}
          </ul>
        </div>
      )}

      <div className={styles.columns}>
        <div className={styles.brand}>
          <Logo className={styles.logo} />
          <p>{t("tagline")}</p>
          <strong>{t("universes")}</strong>
          <div className={styles.socials}>
            {SOCIAL_LINKS.map((social) => (
              <a key={social.label} href={social.href} target="_blank" rel="noreferrer" aria-label={social.label}>
                <social.icon className={styles.socialIcon} />
              </a>
            ))}
          </div>
          <p className={styles.copyright}>{t("copyright", { year: new Date().getFullYear() })}</p>
        </div>

        {FOOTER_COLUMNS.map((column) => (
          <nav key={column.id} className={styles.column} aria-label={t(`columns.${column.id}.title`)}>
            <h3>{t(`columns.${column.id}.title`)}</h3>
            <ul>
              {column.links.map((link) => (
                <li key={link.id}><Link href={link.href}>{t(`columns.${column.id}.${link.id}`)}</Link></li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
    </footer>
  );
}
