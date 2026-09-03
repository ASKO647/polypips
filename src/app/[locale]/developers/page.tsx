import type { Metadata } from "next";
import { Clock, Mail, Brain, LineChart, Radar } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { MarketingPageShell } from "@/components/marketing/marketing-page-shell";
import { PageHero } from "@/components/marketing/page-hero";
import { Container } from "@/components/ui/container";
import { CheckItem } from "@/components/ui/check-item";
import { CONTACT_EMAIL, buildMailto } from "@/lib/mailto";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Pages.Developers");
  return { title: t("metaTitle"), description: t("metaDescription") };
}

export default async function DevelopersPage() {
  const t = await getTranslations("Pages.Developers");
  const capabilities = [
    { icon: Brain, title: t("capabilities.aiAnalyses.title"), description: t("capabilities.aiAnalyses.description") },
    { icon: LineChart, title: t("capabilities.marketData.title"), description: t("capabilities.marketData.description") },
    { icon: Radar, title: t("capabilities.smartWalletActivity.title"), description: t("capabilities.smartWalletActivity.description") },
  ];
  const checklist = t.raw("checklist") as string[];
  const mailtoHref = buildMailto(CONTACT_EMAIL, t("mailtoSubject"), t("mailtoBody"));

  return (
    <MarketingPageShell>
      <PageHero eyebrow={t("eyebrow")} title={t("title")} description={t("description")} />

      <Container className="pb-20 sm:pb-28">
        <div className="mx-auto max-w-2xl">
          <div className="flex items-center gap-3 rounded-[20px] border border-amber-200 bg-amber-50 px-5 py-4">
            <Clock className="h-5 w-5 shrink-0 text-amber-600" strokeWidth={2} />
            <p className="text-sm font-semibold text-amber-800">{t("comingSoonBanner")}</p>
          </div>

          <div className="mt-10 flex flex-col gap-6">
            {capabilities.map((cap) => (
              <div key={cap.title} className="flex gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-500">
                  <cap.icon className="h-5 w-5" strokeWidth={2} />
                </span>
                <div>
                  <h2 className="font-display text-base font-bold text-ink">{cap.title}</h2>
                  <p className="mt-1 text-sm leading-relaxed text-body">{cap.description}</p>
                </div>
              </div>
            ))}
          </div>

          <ul className="mt-8 flex flex-col gap-2.5">
            {checklist.map((item) => (
              <CheckItem key={item}>{item}</CheckItem>
            ))}
          </ul>

          <div className="mt-12 flex flex-col items-center gap-4 rounded-[24px] border border-border bg-surface-muted p-8 text-center">
            <p className="text-base font-semibold text-ink">{t("notifyHeading")}</p>
            <p className="max-w-sm text-sm leading-relaxed text-body">{t("notifyDescription")}</p>
            <a
              href={mailtoHref}
              className="inline-flex items-center gap-2 rounded-full bg-cta px-5 py-2.5 text-sm font-semibold text-white transition-colors duration-150 hover:bg-cta-hover"
            >
              <Mail className="h-4 w-4" /> {t("notifyButton")}
            </a>
          </div>
        </div>
      </Container>
    </MarketingPageShell>
  );
}
