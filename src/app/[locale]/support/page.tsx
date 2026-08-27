import type { Metadata } from "next";
import { Mail, MessageCircle } from "lucide-react";
import { MarketingPageShell } from "@/components/marketing/marketing-page-shell";
import { PageHero } from "@/components/marketing/page-hero";
import { Container } from "@/components/ui/container";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SUPPORT_FAQ_ITEMS } from "@/lib/data/support-faq";
import { CONTACT_EMAIL } from "@/lib/mailto";

export const metadata: Metadata = {
  title: "Support — Polypips",
  description: "Questions fréquentes sur la facturation, le suivi de wallets et le fonctionnement de l'IA.",
};

export default function SupportPage() {
  return (
    <MarketingPageShell>
      <PageHero
        eyebrow="Support"
        title="Centre d'aide"
        description="Les questions les plus fréquentes sur Polypips — et comment nous contacter si vous ne trouvez pas votre réponse."
      />

      <Container className="pb-20 sm:pb-28">
        <div className="mx-auto max-w-3xl">
          <Accordion type="single" collapsible className="flex flex-col gap-4">
            {SUPPORT_FAQ_ITEMS.map((item, i) => (
              <AccordionItem key={item.question} value={`item-${i}`}>
                <AccordionTrigger>{item.question}</AccordionTrigger>
                <AccordionContent>{item.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <div className="mt-12 flex flex-col items-center gap-4 rounded-[24px] border border-border bg-surface-muted p-8 text-center">
            <p className="text-base font-semibold text-ink">Vous ne trouvez pas votre réponse ?</p>
            <div className="flex flex-col items-center gap-3 sm:flex-row">
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="inline-flex items-center gap-2 rounded-full bg-cta px-5 py-2.5 text-sm font-semibold text-white transition-colors duration-150 hover:bg-cta-hover"
              >
                <Mail className="h-4 w-4" /> {CONTACT_EMAIL}
              </a>
              <span className="flex items-center gap-1.5 text-xs font-medium text-body-soft">
                <MessageCircle className="h-3.5 w-3.5" /> ou la bulle de chat en bas à droite
              </span>
            </div>
          </div>
        </div>
      </Container>
    </MarketingPageShell>
  );
}
