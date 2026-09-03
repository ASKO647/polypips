import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { MarketingPageShell } from "@/components/marketing/marketing-page-shell";
import { PageHero } from "@/components/marketing/page-hero";
import { Container } from "@/components/ui/container";
import { CheckItem } from "@/components/ui/check-item";
import { Button, ButtonIcon } from "@/components/ui/button";
import { getFeaturesDetail } from "@/lib/data/features-detail";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Pages.Features");
  return { title: t("metaTitle"), description: t("metaDescription") };
}

export default async function FeaturesPage() {
  const t = await getTranslations("Pages.Features");
  const featuresDetail = getFeaturesDetail(t);

  return (
    <MarketingPageShell>
      <PageHero eyebrow={t("eyebrow")} title={t("title")} description={t("description")} />

      <Container className="flex flex-col gap-16 pb-20 sm:gap-20 sm:pb-28">
        {featuresDetail.map((feature, index) => {
          const reversed = index % 2 === 1;
          return (
            <article
              key={feature.id}
              className={cn(
                "flex flex-col items-center gap-8 lg:flex-row lg:gap-14",
                reversed && "lg:flex-row-reverse"
              )}
            >
              <div className="flex w-full flex-col gap-4 lg:w-1/2">
                <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-brand-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
                  {feature.eyebrow}
                </span>
                <h2 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
                  {feature.title}
                </h2>
                <p className="text-base leading-relaxed text-body sm:text-lg">
                  {feature.description}
                </p>
                <ul className="mt-2 flex flex-col gap-3">
                  {feature.points.map((point) => (
                    <CheckItem key={point}>{point}</CheckItem>
                  ))}
                </ul>
              </div>

              <div className="flex w-full items-center justify-center lg:w-1/2">
                <div className="relative flex aspect-[4/3] w-full max-w-md items-center justify-center overflow-hidden rounded-[28px] border border-border bg-surface-muted">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(229,35,35,0.08),transparent_60%)]" />
                  <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-brand-50 text-brand-500">
                    <feature.icon className="h-9 w-9" strokeWidth={1.75} />
                  </div>
                  <span className="absolute bottom-5 left-1/2 -translate-x-1/2 text-xs font-medium text-body-soft">
                    {t("previewLabel")}
                  </span>
                </div>
              </div>
            </article>
          );
        })}

        <div className="flex flex-col items-center gap-5 pt-4 text-center">
          <p className="max-w-md text-balance text-base leading-relaxed text-body">
            {t("footerNote")}
          </p>
          <Button href="/signup" size="lg">
            {t("ctaLabel")} <ButtonIcon>→</ButtonIcon>
          </Button>
        </div>
      </Container>
    </MarketingPageShell>
  );
}
