import type { Metadata } from "next";
import { Mail } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { MarketingPageShell } from "@/components/marketing/marketing-page-shell";
import { PageHero } from "@/components/marketing/page-hero";
import { Container } from "@/components/ui/container";
import { ContactForm } from "./contact-form";
import { CONTACT_EMAIL } from "@/lib/mailto";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Pages.Contact");
  return { title: t("metaTitle"), description: t("metaDescription") };
}

export default async function ContactPage() {
  const t = await getTranslations("Pages.Contact");

  return (
    <MarketingPageShell>
      <PageHero eyebrow={t("eyebrow")} title={t("title")} description={t("description")} />

      <Container className="pb-20 sm:pb-28">
        <div className="mx-auto max-w-xl">
          <ContactForm />

          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-body-soft">
            <Mail className="h-4 w-4" />
            <span>
              {t("orWriteDirectly")}{" "}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="font-semibold text-brand-600 underline underline-offset-2 hover:text-brand-700"
              >
                {CONTACT_EMAIL}
              </a>
            </span>
          </div>
        </div>
      </Container>
    </MarketingPageShell>
  );
}
