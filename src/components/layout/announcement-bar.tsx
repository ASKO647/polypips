import { useTranslations } from "next-intl";
import { Sparkles } from "lucide-react";
import { Countdown } from "@/components/ui/countdown";
import { getDefaultLaunchDeadline } from "@/lib/deadline";
import styles from "./announcement-marquee.module.css";

export function AnnouncementBar() {
  const t = useTranslations("AnnouncementBar");
  const deadline = getDefaultLaunchDeadline();

  return (
    <div className={styles.bar}>
      <div className={styles.inner}>
        <span className={styles.badge}>
          <Sparkles className="h-3 w-3" strokeWidth={2.5} />
          {t("badge")}
        </span>
        <div className={styles.window}><p className={styles.srOnly}>{t("text")}</p><div className={styles.track} aria-hidden="true">{[0, 1].map((group) => <span className={styles.group} key={group}>{[0, 1].map((item) => <span key={item}>⚡ {t("text")} 🔥</span>)}</span>)}</div></div>
        <Countdown deadline={deadline} variant="cells" className={styles.timer} />
      </div>
    </div>
  );
}
