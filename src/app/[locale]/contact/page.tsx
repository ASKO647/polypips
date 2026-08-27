import type { Metadata } from "next";
import { Mail } from "lucide-react";
import { MarketingPageShell } from "@/components/marketing/marketing-page-shell";
import { PageHero } from "@/components/marketing/page-hero";
import { Container } from "@/components/ui/container";
import { ContactForm } from "./contact-form";
import { CONTACT_EMAIL } from "@/lib/mailto";

export const metadata: Metadata = {
  title: "Contact — Polypips",
  description: "Une question, une remarque ? Contactez l'équipe Polypips.",
};

export default function ContactPage() {
  return (
    <MarketingPageShell>
      <PageHero
        eyebrow="Contact"
        title="Contactez-nous"
        description="Une question, une remarque, un problème technique ? Écrivez-nous."
      />

      <Container className="pb-20 sm:pb-28">
        <div className="mx-auto max-w-xl">
          <ContactForm />

          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-body-soft">
            <Mail className="h-4 w-4" />
            <span>
              Ou écrivez directement à{" "}
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
