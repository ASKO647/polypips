import type { Metadata } from "next";
import { Handshake, LinkIcon, Wallet, Mail } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { MarketingPageShell } from "@/components/marketing/marketing-page-shell";
import { PageHero } from "@/components/marketing/page-hero";
import { Container } from "@/components/ui/container";
import { CONTACT_EMAIL, buildMailto } from "@/lib/mailto";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Pages.Partners");
  return { title: t("metaTitle"), description: t("metaDescription") };
}

export default async function PartnersPage() {
  const t = await getTranslations("Pages.Partners");
  const steps = [
    { icon: Handshake, title: t("steps.applyTitle"), description: t("steps.applyDescription") },
    { icon: LinkIcon, title: t("steps.reviewTitle"), description: t("steps.reviewDescription") },
    { icon: Wallet, title: t("steps.paidTitle"), description: t("steps.paidDescription") },
  ];
  const mailtoHref = buildMailto(CONTACT_EMAIL, t("mailtoSubject"), t("mailtoBody"));

  return (
    <MarketingPageShell>
      <PageHero eyebrow={t("eyebrow")} title={t("title")} description={t("description")} />

      <Container className="pb-20 sm:pb-28">
        <div className="mx-auto max-w-2xl">
          <div className="flex flex-col gap-8">
            {steps.map((step, i) => (
              <div key={step.title} className="relative flex gap-5">
                <div className="flex flex-col items-center">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-[#F3C7C7] bg-brand-50">
                    <step.icon className="h-6 w-6 text-brand-500" strokeWidth={1.75} />
                  </div>
                  {i < steps.length - 1 && (
                    <span className="mt-2 w-px flex-1 border-l-2 border-dashed border-brand-200" />
                  )}
                </div>
                <div className="pb-2">
                  <h2 className="font-display text-lg font-bold text-ink">{step.title}</h2>
                  <p className="mt-1.5 text-sm leading-relaxed text-body">{step.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-[20px] border border-border bg-surface-muted px-5 py-4">
            <p className="text-sm leading-relaxed text-body">{t("note")}</p>
          </div>

          <div className="mt-12 flex flex-col items-center gap-4 rounded-[24px] border border-border bg-surface p-8 text-center">
            <p className="text-base font-semibold text-ink">{t("ctaHeading")}</p>
            <p className="max-w-sm text-sm leading-relaxed text-body">{t("ctaDescription")}</p>
            <a
              href={mailtoHref}
              className="inline-flex items-center gap-2 rounded-full bg-cta px-5 py-2.5 text-sm font-semibold text-white transition-colors duration-150 hover:bg-cta-hover"
            >
              <Mail className="h-4 w-4" /> {t("ctaButton")}
            </a>
          </div>
        </div>
      </Container>
    </MarketingPageShell>
  );
}
