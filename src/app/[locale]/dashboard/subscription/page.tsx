import type { Metadata } from "next";
import { SubscriptionPlans } from "@/components/dashboard/settings/subscription-plans";
import { createClient } from "@/lib/supabase/server";
import { fetchSubscription } from "@/lib/supabase/subscriptions";

export const metadata: Metadata = {
  title: "Abonnement — Polypips",
};

const DATE_FORMATTER = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export default async function DashboardSubscriptionPage() {
  const supabase = await createClient();
  const subscription = await fetchSubscription(supabase);
  const periodEndLabel = subscription?.currentPeriodEnd
    ? DATE_FORMATTER.format(new Date(subscription.currentPeriodEnd))
    : null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-dash-text sm:text-3xl">
          Abonnement
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-dash-text-tertiary sm:text-base">
          Choisissez le plan qui vous convient — le même accès complet à Polypips, sans
          fonctionnalité cachée derrière un palier supérieur.
        </p>
      </div>

      <SubscriptionPlans subscription={subscription} periodEndLabel={periodEndLabel} />
    </div>
  );
}
