import { Check, Sparkles, TrendingUp } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { CheckItem } from "@/components/ui/check-item";
import { Countdown } from "@/components/ui/countdown";
import { SocialProofRow } from "@/components/ui/social-proof-row";
import { PricingPlanButton } from "@/components/marketing/pricing-plan-button";
import { getDefaultLaunchDeadline } from "@/lib/deadline";
import { getPricingPlans } from "@/lib/data/pricing";

/**
 * Single-plan pricing card — there is only one real subscription
 * (Pro), entered through a 3-day, 0,99 € discovery trial that rolls
 * automatically into 29,99 €/mois. Checkout still targets the
 * "decouverte" plan id (see lib/stripe/plans + the webhook's own
 * upsertSubscription, which transitions plan/status once the trial
 * period ends) — the "plans" namespace still holds both entries for
 * that reason, this section just no longer displays them as two
 * competing tiers.
 */
export async function Pricing() {
  const deadline = getDefaultLaunchDeadline();
  const t = await getTranslations("Pricing");
  const tPlans = await getTranslations("Plans");
  const plans = getPricingPlans(tPlans);
  const plan = plans.find((p) => p.id === "decouverte") ?? plans[0];
  const proPlan = plans.find((p) => p.id === "pro") ?? plans[1];
  const includedFeatures = Object.values(t.raw("features") as Record<string, string>);
  const guarantees = [t("guarantee1"), t("guarantee2"), t("guarantee3")];

  return (
    <section id="tarifs" className="reveal py-10 sm:py-12">
      <Container className="flex flex-col items-center gap-8">
        <SectionHeading
          eyebrow={t("eyebrow")}
          title={t("title")}
          description={t("description")}
        />

        <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-4 py-2 text-xs font-bold uppercase tracking-wide text-brand-600">
          <Sparkles className="h-3.5 w-3.5" strokeWidth={2.5} />
          {t("offerLimited")}
          <Countdown deadline={deadline} variant="inline" />
        </span>

        <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
          <div className="flex flex-col gap-6 rounded-[28px] border-2 border-brand-500 bg-[#FFF7F7] p-8 shadow-[0_30px_70px_-28px_rgba(229,35,35,0.35)]">
            <SocialProofRow />

            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-500 text-white">
                <TrendingUp className="h-6 w-6" strokeWidth={2} />
              </span>
              <div>
                <h3 className="font-display text-lg font-semibold text-ink">
                  {t("cardTitle")}
                </h3>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-body">{t("cardDescription")}</p>

            <div className="flex flex-col gap-1">
              <span className="font-display text-5xl font-bold tracking-tight text-ink">
                {plan.price}
              </span>
              <p className="text-sm font-semibold text-body">
                {plan.priceSuffix}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-body-soft">
                {t("thenPrefix")} {proPlan.price}
                {proPlan.priceSuffix} {t("thenSuffix")}
              </p>
            </div>

            <PricingPlanButton
              planId="decouverte"
              label={`${t("ctaPrefix")} ${plan.price}`}
              variant="primary"
              className="h-[54px] w-full"
            />

            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5">
              {guarantees.map((item) => (
                <span
                  key={item}
                  className="flex items-center gap-1.5 text-xs font-medium text-body-soft"
                >
                  <Check className="h-3.5 w-3.5 text-brand-500" strokeWidth={2.5} />
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-border bg-surface p-8">
            <ul className="flex flex-col gap-3">
              {includedFeatures.map((feature) => (
                <CheckItem key={feature}>{feature}</CheckItem>
              ))}
            </ul>
          </div>
        </div>
      </Container>
    </section>
  );
}
