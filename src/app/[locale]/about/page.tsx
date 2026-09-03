import type { Metadata } from "next";
import { Brain, ShieldCheck, Sparkles } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { MarketingPageShell } from "@/components/marketing/marketing-page-shell";
import { PageHero } from "@/components/marketing/page-hero";
import { Container } from "@/components/ui/container";
import { Button, ButtonIcon } from "@/components/ui/button";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Pages.About");
  return { title: t("metaTitle"), description: t("metaDescription") };
}

export default async function AboutPage() {
  const t = await getTranslations("Pages.About");

  const VALUES = [
    { icon: Brain, title: t("values.aiTitle"), description: t("values.aiDescription") },
    {
      icon: ShieldCheck,
      title: t("values.noPromiseTitle"),
      description: t("values.noPromiseDescription"),
    },
    {
      icon: Sparkles,
      title: t("values.simplicityTitle"),
      description: t("values.simplicityDescription"),
    },
  ];

  return (
    <MarketingPageShell>
      <PageHero eyebrow={t("eyebrow")} title={t("title")} />

      <Container className="pb-20 sm:pb-28">
        <div className="mx-auto flex max-w-2xl flex-col gap-6 text-base leading-relaxed text-body sm:text-lg">
          <p>{t("paragraph1")}</p>
          <p>{t("paragraph2")}</p>
          <p>{t("paragraph3")}</p>
        </div>

        <div className="mx-auto mt-16 grid max-w-4xl grid-cols-1 gap-6 sm:grid-cols-3">
          {VALUES.map((value) => (
            <div key={value.title} className="flex flex-col gap-3 rounded-[24px] border border-border bg-surface p-6">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-50 text-brand-500">
                <value.icon className="h-5 w-5" strokeWidth={2} />
              </span>
              <h2 className="font-display text-base font-bold text-ink">{value.title}</h2>
              <p className="text-sm leading-relaxed text-body">{value.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 flex flex-col items-center gap-5 text-center">
          <Button href="/signup" size="lg">
            {t("ctaLabel")} <ButtonIcon>→</ButtonIcon>
          </Button>
        </div>
      </Container>
    </MarketingPageShell>
  );
}
