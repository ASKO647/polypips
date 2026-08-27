import type { Metadata } from "next";
import { Handshake, LinkIcon, Wallet, Mail } from "lucide-react";
import { MarketingPageShell } from "@/components/marketing/marketing-page-shell";
import { PageHero } from "@/components/marketing/page-hero";
import { Container } from "@/components/ui/container";
import { CONTACT_EMAIL, buildMailto } from "@/lib/mailto";

export const metadata: Metadata = {
  title: "Partenaires — Polypips",
  description: "Le programme partenaires Polypips : une commission pour chaque personne que vous nous amenez.",
};

const STEPS = [
  {
    icon: Handshake,
    title: "Vous candidatez",
    description:
      "Écrivez-nous en nous présentant votre audience et le canal sur lequel vous comptez relayer Polypips.",
  },
  {
    icon: LinkIcon,
    title: "Nous étudions et validons",
    description:
      "Notre équipe examine chaque candidature manuellement et vous attribue, si elle est acceptée, un lien de suivi personnel et un taux de commission.",
  },
  {
    icon: Wallet,
    title: "Vous êtes rémunéré",
    description:
      "Chaque inscription réalisée via votre lien est suivie ; la commission due est calculée puis versée manuellement par notre équipe.",
  },
];

export default function PartnersPage() {
  const mailtoHref = buildMailto(
    CONTACT_EMAIL,
    "Candidature partenaire Polypips",
    "Bonjour,\n\nJe souhaite candidater au programme partenaires Polypips.\n\nMon audience / canal de diffusion : \nMon adresse email : "
  );

  return (
    <MarketingPageShell>
      <PageHero
        eyebrow="Partenaires"
        title="Programme partenaires"
        description="Recommandez Polypips à votre audience et percevez une commission pour chaque inscription réalisée via votre lien."
      />

      <Container className="pb-20 sm:pb-28">
        <div className="mx-auto max-w-2xl">
          <div className="flex flex-col gap-8">
            {STEPS.map((step, i) => (
              <div key={step.title} className="relative flex gap-5">
                <div className="flex flex-col items-center">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-[#F3C7C7] bg-brand-50">
                    <step.icon className="h-6 w-6 text-brand-500" strokeWidth={1.75} />
                  </div>
                  {i < STEPS.length - 1 && (
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
            <p className="text-sm leading-relaxed text-body">
              Le programme partenaires est actuellement géré au cas par cas, sans inscription en
              libre-service : chaque candidature est étudiée individuellement, et le taux de
              commission dépend de votre audience et du canal utilisé.
            </p>
          </div>

          <div className="mt-12 flex flex-col items-center gap-4 rounded-[24px] border border-border bg-surface p-8 text-center">
            <p className="text-base font-semibold text-ink">Prêt à candidater ?</p>
            <p className="max-w-sm text-sm leading-relaxed text-body">
              Présentez-nous votre audience et le canal sur lequel vous relaierez Polypips.
            </p>
            <a
              href={mailtoHref}
              className="inline-flex items-center gap-2 rounded-full bg-cta px-5 py-2.5 text-sm font-semibold text-white transition-colors duration-150 hover:bg-cta-hover"
            >
              <Mail className="h-4 w-4" /> Candidater par email
            </a>
          </div>
        </div>
      </Container>
    </MarketingPageShell>
  );
}
