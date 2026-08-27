import type { Metadata } from "next";
import { Check } from "lucide-react";
import { MarketingPageShell } from "@/components/marketing/marketing-page-shell";
import { PageHero } from "@/components/marketing/page-hero";
import { Container } from "@/components/ui/container";
import { CheckItem } from "@/components/ui/check-item";
import { PricingPlanButton } from "@/components/marketing/pricing-plan-button";
import { PRICING_PLANS } from "@/lib/data/pricing";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Tarifs — Polypips",
  description: "L'offre découverte à 0,99 € pendant 3 jours, puis l'abonnement Pro à 29,99 €/mois.",
};

export default function PricingPage() {
  const decouverte = PRICING_PLANS.find((p) => p.id === "decouverte") ?? PRICING_PLANS[0];
  const pro = PRICING_PLANS.find((p) => p.id === "pro") ?? PRICING_PLANS[1];

  return (
    <MarketingPageShell>
      <PageHero
        eyebrow="Tarifs"
        title="Un seul accès, toutes les fonctionnalités"
        description="Pas de paliers, pas de fonctionnalité verrouillée derrière un plan supérieur : commencez par l'offre découverte, ou passez directement à l'abonnement Pro."
      />

      <Container className="pb-20 sm:pb-28">
        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 sm:grid-cols-2">
          {[decouverte, pro].map((plan) => (
            <div
              key={plan.id}
              className={cn(
                "flex flex-col gap-6 rounded-[28px] border p-8",
                plan.highlighted
                  ? "border-2 border-brand-500 bg-[#FFF7F7] shadow-[0_30px_70px_-28px_rgba(229,35,35,0.35)]"
                  : "border-border bg-surface"
              )}
            >
              <div>
                <h2 className="font-display text-xl font-semibold text-ink">{plan.name}</h2>
                <p className="mt-1 text-sm text-body">{plan.tagline}</p>
              </div>

              <div className="flex flex-col gap-1">
                <span className="font-display text-4xl font-bold tracking-tight text-ink">
                  {plan.price}
                </span>
                <p className="text-sm font-semibold text-body">{plan.priceSuffix}</p>
                {plan.afterOffer && (
                  <p className="mt-1 text-xs leading-relaxed text-body-soft">{plan.afterOffer}</p>
                )}
                {plan.originalPrice && (
                  <p className="mt-1 text-xs leading-relaxed text-body-soft">
                    <span className="line-through">{plan.originalPrice}</span> à titre indicatif
                  </p>
                )}
              </div>

              <ul className="flex flex-col gap-3">
                {plan.features.map((feature) => (
                  <CheckItem key={feature}>{feature}</CheckItem>
                ))}
              </ul>

              <PricingPlanButton
                planId={plan.id === "pro" ? "pro" : "decouverte"}
                label={plan.cta}
                variant={plan.highlighted ? "primary" : "outline"}
                className="h-[54px] w-full"
              />
            </div>
          ))}
        </div>

        <div className="mx-auto mt-10 flex max-w-4xl flex-wrap items-center justify-center gap-x-8 gap-y-2">
          {["Accès instantané", "Annulez à tout moment", "Paiement sécurisé par Stripe"].map(
            (item) => (
              <span
                key={item}
                className="flex items-center gap-1.5 text-xs font-medium text-body-soft"
              >
                <Check className="h-3.5 w-3.5 text-brand-500" strokeWidth={2.5} />
                {item}
              </span>
            )
          )}
        </div>

        <div className="mx-auto mt-16 max-w-2xl rounded-[24px] border border-border bg-surface-muted p-6 text-center sm:p-8">
          <p className="text-sm leading-relaxed text-body">
            Les analyses fournies par Polypips sont à titre informatif et ne constituent pas un
            conseil financier ou d&apos;investissement. Le module Copy Trading fonctionne
            exclusivement en simulation : aucun ordre réel n&apos;est jamais exécuté pour votre
            compte.
          </p>
        </div>
      </Container>
    </MarketingPageShell>
  );
}
