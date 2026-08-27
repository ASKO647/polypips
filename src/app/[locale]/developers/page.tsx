import type { Metadata } from "next";
import { Clock, Mail, Brain, LineChart, Radar } from "lucide-react";
import { MarketingPageShell } from "@/components/marketing/marketing-page-shell";
import { PageHero } from "@/components/marketing/page-hero";
import { Container } from "@/components/ui/container";
import { CheckItem } from "@/components/ui/check-item";
import { CONTACT_EMAIL, buildMailto } from "@/lib/mailto";

export const metadata: Metadata = {
  title: "API — Polypips",
  description: "L'API publique Polypips est en cours de développement, disponible prochainement.",
};

const CAPABILITIES = [
  {
    icon: Brain,
    title: "Analyses IA",
    description: "Récupérer une décision, une probabilité estimée et une explication pour un marché ou un match donné.",
  },
  {
    icon: LineChart,
    title: "Données de marché",
    description: "Accéder à la sélection de marchés établie par l'IA et à leurs métadonnées (catégorie, échéance, probabilité).",
  },
  {
    icon: Radar,
    title: "Activité Smart Money",
    description: "Consulter l'activité des portefeuilles suivis, pour intégrer un signal externe dans vos propres outils.",
  },
];

export default function DevelopersPage() {
  const mailtoHref = buildMailto(
    CONTACT_EMAIL,
    "Notification API Polypips",
    "Bonjour,\n\nJe souhaite être notifié(e) de la disponibilité de l'API Polypips.\n\nMon adresse email : "
  );

  return (
    <MarketingPageShell>
      <PageHero
        eyebrow="API"
        title="L'API publique Polypips"
        description="Intégrez les analyses et les données de marché de Polypips directement dans vos propres outils."
      />

      <Container className="pb-20 sm:pb-28">
        <div className="mx-auto max-w-2xl">
          <div className="flex items-center gap-3 rounded-[20px] border border-amber-200 bg-amber-50 px-5 py-4">
            <Clock className="h-5 w-5 shrink-0 text-amber-600" strokeWidth={2} />
            <p className="text-sm font-semibold text-amber-800">
              API en cours de développement — disponible prochainement.
            </p>
          </div>

          <div className="mt-10 flex flex-col gap-6">
            {CAPABILITIES.map((cap) => (
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
            <CheckItem>Authentification par clé d&apos;API</CheckItem>
            <CheckItem>Endpoints REST documentés</CheckItem>
            <CheckItem>Quotas alignés sur votre abonnement Polypips</CheckItem>
          </ul>

          <div className="mt-12 flex flex-col items-center gap-4 rounded-[24px] border border-border bg-surface-muted p-8 text-center">
            <p className="text-base font-semibold text-ink">
              Soyez averti(e) dès son ouverture
            </p>
            <p className="max-w-sm text-sm leading-relaxed text-body">
              Écrivez-nous et nous vous préviendrons personnellement dès que l&apos;API sera
              disponible.
            </p>
            <a
              href={mailtoHref}
              className="inline-flex items-center gap-2 rounded-full bg-cta px-5 py-2.5 text-sm font-semibold text-white transition-colors duration-150 hover:bg-cta-hover"
            >
              <Mail className="h-4 w-4" /> Être notifié par email
            </a>
          </div>
        </div>
      </Container>
    </MarketingPageShell>
  );
}
