import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SubscriptionPlans } from "@/components/dashboard/settings/subscription-plans";
import { createClient } from "@/lib/supabase/server";
import { fetchSubscription } from "@/lib/supabase/subscriptions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("SubscriptionPage");
  return { title: t("metaTitle") };
}

const DATE_FORMATTER = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export default async function DashboardSubscriptionPage() {
  const t = await getTranslations("SubscriptionPage");
  const supabase = await createClient();
  const subscription = await fetchSubscription(supabase);
  const periodEndLabel = subscription?.currentPeriodEnd
    ? DATE_FORMATTER.format(new Date(subscription.currentPeriodEnd))
    : null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-dash-text sm:text-3xl">
          {t("title")}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-dash-text-tertiary sm:text-base">
          {t("description")}
        </p>
      </div>

      <SubscriptionPlans subscription={subscription} periodEndLabel={periodEndLabel} />
    </div>
  );
}
