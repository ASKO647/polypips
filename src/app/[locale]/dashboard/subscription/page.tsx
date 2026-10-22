import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { SubscriptionPlans } from "@/components/dashboard/settings/subscription-plans";
import { createClient } from "@/lib/supabase/server";
import { fetchSubscription } from "@/lib/supabase/subscriptions";
import { DashboardChrome } from "@/components/dashboard/shared/dashboard-chrome";
import { Link } from "@/i18n/navigation";
import styles from "@/components/dashboard/settings/subscription-plans.module.css";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("SubscriptionPage");
  return { title: t("metaTitle") };
}

export default async function DashboardSubscriptionPage() {
  const t = await getTranslations("SubscriptionPage");
  const locale = await getLocale();
  const supabase = await createClient();
  const subscription = await fetchSubscription(supabase);
  const periodEndLabel = subscription?.currentPeriodEnd
    ? new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric" }).format(
        new Date(subscription.currentPeriodEnd),
      )
    : null;

  return (
    <DashboardChrome hideHeader title={t("title")}><div className={`${styles.page} flex flex-col gap-6`}>
      <span className={styles.breadcrumb}>Polypips / {locale === "fr" ? "Profil / Abonnement" : "Profile / Subscription"}</span>
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-dash-text sm:text-3xl">
          {locale === "fr" ? "Choisir son abonnement" : "Choose your plan"}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-dash-text-tertiary sm:text-base">
          {locale === "fr" ? "Choisissez la formule adaptée à votre manière d’analyser." : "Choose the plan that fits your analysis needs."}
        </p>
      </div>
      <nav className={styles.tabs} aria-label="Profil"><Link href="/dashboard/settings">{locale === "fr" ? "Profil" : "Profile"}</Link><span aria-current="page">{locale === "fr" ? "Abonnement" : "Subscription"}</span><Link href="/dashboard/settings">{locale === "fr" ? "Retour aux paramètres" : "Back to settings"}</Link></nav>

      <SubscriptionPlans subscription={subscription} periodEndLabel={periodEndLabel} />
    </div></DashboardChrome>
  );
}
