import type { Metadata } from "next";
import { Check } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { MarketingPageShell } from "@/components/marketing/marketing-page-shell";
import { PageHero } from "@/components/marketing/page-hero";
import { Container } from "@/components/ui/container";
import { CheckItem } from "@/components/ui/check-item";
import { PricingPlanButton } from "@/components/marketing/pricing-plan-button";
import { getPricingPlans } from "@/lib/data/pricing";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Pages.Pricing");
  return { title: t("metaTitle"), description: t("metaDescription") };
}

export default async function PricingPage() {
  const t = await getTranslations("Pages.Pricing");
  const tPlans = await getTranslations("Plans");
  const plans = getPricingPlans(tPlans);
  const decouverte = plans.find((p) => p.id === "decouverte") ?? plans[0];
  const pro = plans.find((p) => p.id === "pro") ?? plans[1];

  return (
    <MarketingPageShell>
      <PageHero
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("description")}
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
                    <span className="line-through">{plan.originalPrice}</span> {t("indicative")}
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
          {(t.raw("guarantees") as string[]).map((item) => (
            <span
              key={item}
              className="flex items-center gap-1.5 text-xs font-medium text-body-soft"
            >
              <Check className="h-3.5 w-3.5 text-brand-500" strokeWidth={2.5} />
              {item}
            </span>
          ))}
        </div>

        <div className="mx-auto mt-16 max-w-2xl rounded-[24px] border border-border bg-surface-muted p-6 text-center sm:p-8">
          <p className="text-sm leading-relaxed text-body">{t("disclaimer")}</p>
        </div>
      </Container>
    </MarketingPageShell>
  );
}
