import type { Metadata } from "next";
import { Brain, ShieldCheck, Sparkles } from "lucide-react";
import { MarketingPageShell } from "@/components/marketing/marketing-page-shell";
import { PageHero } from "@/components/marketing/page-hero";
import { Container } from "@/components/ui/container";
import { Button, ButtonIcon } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "À propos — Polypips",
  description: "Notre mission : rendre l'analyse des marchés de prédiction et du sport accessible grâce à l'IA.",
};

const VALUES = [
  {
    icon: Brain,
    title: "L'IA comme outil d'aide à la décision",
    description:
      "Pas un oracle, pas une martingale : un outil qui traite l'information disponible et l'explique clairement, pour que la décision finale reste la vôtre.",
  },
  {
    icon: ShieldCheck,
    title: "Aucune promesse de gain",
    description:
      "Nous ne prétendons jamais garantir un résultat. Toute analyse reste une estimation, jamais une certitude.",
  },
  {
    icon: Sparkles,
    title: "La simplicité avant tout",
    description:
      "Une seule offre, sans palier caché, et des explications en langage clair plutôt que du jargon technique.",
  },
];

export default function AboutPage() {
  return (
    <MarketingPageShell>
      <PageHero eyebrow="À propos" title="Notre mission" />

      <Container className="pb-20 sm:pb-28">
        <div className="mx-auto flex max-w-2xl flex-col gap-6 text-base leading-relaxed text-body sm:text-lg">
          <p>
            Polymarket et les marchés de prédiction en général reposent sur une idée simple :
            transformer une question sur l&apos;avenir en un prix, fixé par l&apos;offre et la
            demande. Comprendre ce prix — et se faire un avis dessus — demande de lire des règles
            de résolution, de croiser des sources, et de garder la tête froide face à ses propres
            biais. C&apos;est un travail que peu de gens ont le temps de faire correctement pour
            chaque marché qui les intéresse.
          </p>
          <p>
            Polypips est né de ce constat : donner accès à une analyse méthodique et honnête,
            construite par une intelligence artificielle qui applique la même rigueur à chaque
            marché, qu&apos;il s&apos;agisse d&apos;un événement Polymarket ou d&apos;un match
            sportif. Notre objectif n&apos;est pas de prédire l&apos;avenir à votre place, mais de
            vous donner les moyens de vous faire un avis plus informé, plus vite.
          </p>
          <p>
            Cela implique un engagement que nous prenons au sérieux : ne jamais présenter une
            estimation comme une certitude, ne jamais promettre un gain, et construire des outils
            — comme le Copy Trading en simulation — qui vous laissent tester une approche sans
            jamais vous exposer à un risque que vous n&apos;auriez pas choisi vous-même.
          </p>
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
            Débutez pour 0,99&nbsp;€ <ButtonIcon>→</ButtonIcon>
          </Button>
        </div>
      </Container>
    </MarketingPageShell>
  );
}
