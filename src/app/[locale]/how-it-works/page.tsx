import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { MarketingPageShell } from "@/components/marketing/marketing-page-shell";
import { PageHero } from "@/components/marketing/page-hero";
import { Container } from "@/components/ui/container";
import { Button, ButtonIcon } from "@/components/ui/button";
import { getOnboardingSteps } from "@/lib/data/onboarding-steps";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Pages.HowItWorks");
  return { title: t("metaTitle"), description: t("metaDescription") };
}

export default async function HowItWorksPage() {
  const t = await getTranslations("Pages.HowItWorks");
  const steps = getOnboardingSteps(t);

  return (
    <MarketingPageShell>
      <PageHero eyebrow={t("eyebrow")} title={t("title")} description={t("description")} />

      <Container className="pb-20 sm:pb-28">
        <div className="mx-auto flex max-w-2xl flex-col gap-10">
          {steps.map((step, i) => (
            <div key={step.number} className="relative flex gap-6">
              <div className="flex flex-col items-center">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-[#F3C7C7] bg-brand-50">
                  <step.icon className="h-7 w-7 text-brand-500" strokeWidth={1.75} />
                </div>
                {i < steps.length - 1 && (
                  <span className="mt-2 w-px flex-1 border-l-2 border-dashed border-brand-200" />
                )}
              </div>
              <div className="pb-4">
                <span className="text-xs font-bold uppercase tracking-wide text-brand-500">
                  {t("stepLabel", { number: step.number })}
                </span>
                <h2 className="mt-1 font-display text-xl font-bold text-ink sm:text-2xl">
                  {step.title}
                </h2>
                <p className="mt-2 text-base leading-relaxed text-body">{step.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-col items-center gap-5 text-center">
          <Button href="/signup" size="lg">
            {t("ctaLabel")} <ButtonIcon>→</ButtonIcon>
          </Button>
        </div>
      </Container>
    </MarketingPageShell>
  );
}
