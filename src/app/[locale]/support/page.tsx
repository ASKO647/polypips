import type { Metadata } from "next";
import { Mail, MessageCircle } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { MarketingPageShell } from "@/components/marketing/marketing-page-shell";
import { PageHero } from "@/components/marketing/page-hero";
import { Container } from "@/components/ui/container";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { getSupportFaqItems } from "@/lib/data/support-faq";
import { CONTACT_EMAIL } from "@/lib/mailto";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Pages.Support");
  return { title: t("metaTitle"), description: t("metaDescription") };
}

export default async function SupportPage() {
  const t = await getTranslations("Pages.Support");
  const faqItems = getSupportFaqItems(t);

  return (
    <MarketingPageShell>
      <PageHero eyebrow={t("eyebrow")} title={t("title")} description={t("description")} />

      <Container className="pb-20 sm:pb-28">
        <div className="mx-auto max-w-3xl">
          <Accordion type="single" collapsible className="flex flex-col gap-4">
            {faqItems.map((item, i) => (
              <AccordionItem key={item.key} value={`item-${i}`}>
                <AccordionTrigger>{item.question}</AccordionTrigger>
                <AccordionContent>{item.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <div className="mt-12 flex flex-col items-center gap-4 rounded-[24px] border border-border bg-surface-muted p-8 text-center">
            <p className="text-base font-semibold text-ink">{t("noAnswerHeading")}</p>
            <div className="flex flex-col items-center gap-3 sm:flex-row">
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="inline-flex items-center gap-2 rounded-full bg-cta px-5 py-2.5 text-sm font-semibold text-white transition-colors duration-150 hover:bg-cta-hover"
              >
                <Mail className="h-4 w-4" /> {CONTACT_EMAIL}
              </a>
              <span className="flex items-center gap-1.5 text-xs font-medium text-body-soft">
                <MessageCircle className="h-3.5 w-3.5" /> {t("chatHint")}
              </span>
            </div>
          </div>
        </div>
      </Container>
    </MarketingPageShell>
  );
}
