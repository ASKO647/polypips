import type { Metadata } from "next";
import { MarketingPageShell } from "@/components/marketing/marketing-page-shell";
import { PageHero } from "@/components/marketing/page-hero";
import { Container } from "@/components/ui/container";
import { Button, ButtonIcon } from "@/components/ui/button";
import { ONBOARDING_STEPS } from "@/lib/data/onboarding-steps";

export const metadata: Metadata = {
  title: "Comment ça marche — Polypips",
  description: "De l'inscription au suivi de vos performances, le parcours Polypips en 4 étapes.",
};

export default function HowItWorksPage() {
  return (
    <MarketingPageShell>
      <PageHero
        eyebrow="Processus"
        title="Comment ça marche ?"
        description="De l'inscription au suivi de vos performances, en quatre étapes claires."
      />

      <Container className="pb-20 sm:pb-28">
        <div className="mx-auto flex max-w-2xl flex-col gap-10">
          {ONBOARDING_STEPS.map((step, i) => (
            <div key={step.number} className="relative flex gap-6">
              <div className="flex flex-col items-center">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-[#F3C7C7] bg-brand-50">
                  <step.icon className="h-7 w-7 text-brand-500" strokeWidth={1.75} />
                </div>
                {i < ONBOARDING_STEPS.length - 1 && (
                  <span className="mt-2 w-px flex-1 border-l-2 border-dashed border-brand-200" />
                )}
              </div>
              <div className="pb-4">
                <span className="text-xs font-bold uppercase tracking-wide text-brand-500">
                  Étape {step.number}
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
            Débutez pour 0,99&nbsp;€ <ButtonIcon>→</ButtonIcon>
          </Button>
        </div>
      </Container>
    </MarketingPageShell>
  );
}
