import { Gift } from "lucide-react";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { Button } from "@/components/ui/button";
import { CheckItem } from "@/components/ui/check-item";
import { Countdown } from "@/components/ui/countdown";
import { getDefaultLaunchDeadline } from "@/lib/deadline";
import { PRICING_PLANS } from "@/lib/data/pricing";
import { cn } from "@/lib/utils";

export function Pricing() {
  const deadline = getDefaultLaunchDeadline();

  return (
    <section id="tarifs" className="reveal py-10 sm:py-12">
      <Container className="flex flex-col gap-8">
        <SectionHeading
          eyebrow="Tarifs"
          title="Choisissez votre plan"
          description="Pas d'essai gratuit. Juste un accès immédiat à la puissance de Polypips."
        />

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
          {PRICING_PLANS.map((plan) => (
            <div
              key={plan.id}
              className={cn(
                "relative flex flex-col gap-6 rounded-[28px] border p-8 transition-all duration-200 ease-out hover:-translate-y-1",
                plan.highlighted
                  ? "h-[640px] border-2 border-brand-500 bg-[#FFF7F7] shadow-[0_30px_70px_-28px_rgba(229,35,35,0.35)] lg:-translate-y-3"
                  : "border-border bg-surface hover:shadow-[0_16px_32px_-16px_rgba(18,5,7,0.12)]"
              )}
            >
              {plan.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-ink-solid px-3.5 py-1 text-xs font-bold text-white shadow-md">
                  {plan.badge}
                </span>
              )}
              {plan.hasCountdown && (
                <span className="absolute -top-3 right-6 rounded-full border border-brand-200 bg-surface px-3 py-1 shadow-sm">
                  <Countdown deadline={deadline} variant="inline" />
                </span>
              )}

              <div className="flex min-h-[168px] flex-col gap-1.5">
                <h3 className="flex items-center font-display text-lg font-semibold text-ink">
                  {plan.id === "decouverte" && (
                    <Gift className="mr-1.5 h-4 w-4 text-brand-500" />
                  )}
                  {plan.name}
                </h3>
                <p className="text-sm text-body">{plan.tagline}</p>

                <div className="mt-3 flex flex-col gap-1">
                  <div className="flex items-baseline gap-2">
                    <span className="font-display text-4xl font-bold tracking-tight text-ink">
                      {plan.price}
                    </span>
                    {plan.originalPrice && (
                      <span className="text-base font-medium text-body-soft line-through">
                        {plan.originalPrice}
                      </span>
                    )}
                    <span className="text-sm font-medium text-body-soft">
                      {plan.priceSuffix}
                    </span>
                  </div>
                  {plan.afterOffer && (
                    <p className="text-xs font-medium text-body-soft">
                      {plan.afterOffer}
                    </p>
                  )}
                </div>
              </div>

              <Button
                href="/signup"
                variant={plan.highlighted ? "primary" : "outline"}
                size="lg"
                className="h-[54px] w-full"
              >
                {plan.cta}
              </Button>

              <ul className="flex flex-col gap-3 border-t border-border pt-6">
                {plan.features.map((feature) => (
                  <CheckItem key={feature}>{feature}</CheckItem>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
