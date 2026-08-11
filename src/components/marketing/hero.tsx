import { PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SocialProofRow } from "@/components/ui/social-proof-row";
import { CheckItem } from "@/components/ui/check-item";
import { HeroBackground } from "@/components/marketing/hero-background";

const TRUST_ITEMS = [
  "Accès complet pendant 3 jours",
  "Aucune carte requise",
  "Annulation à tout moment",
  "Accès instantané",
];

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden">
      <HeroBackground />

      <div className="relative mx-auto flex w-full max-w-[860px] flex-col items-center px-6 pt-16 pb-20 text-center sm:pt-20 sm:pb-24 lg:pt-24 lg:pb-28">
        <SocialProofRow align="center" className="animate-fade-up" />

        <h1
          className="mt-8 animate-fade-up text-balance font-display text-[2.5rem] font-bold leading-[1.08] tracking-tight text-ink sm:text-6xl lg:text-[4rem]"
          style={{ animationDelay: "80ms" }}
        >
          L&apos;IA qui analyse.
          <br />
          Vous décidez.
          <br />
          <span className="text-brand-500">Le marché suit.</span>
        </h1>

        <p
          className="mt-6 max-w-xl animate-fade-up text-balance text-lg leading-relaxed text-body"
          style={{ animationDelay: "140ms" }}
        >
          Polypips analyse les marchés Polymarket en profondeur, vous indique
          quelle position présente le meilleur signal et vous explique
          pourquoi.
        </p>
        <p
          className="mt-3 animate-fade-up text-balance text-sm font-semibold uppercase tracking-wide text-body-soft"
          style={{ animationDelay: "180ms" }}
        >
          Plus de recherches. Plus d&apos;hésitations. Juste l&apos;avantage
          que vous cherchez.
        </p>

        <div
          className="mt-9 flex animate-fade-up flex-col items-center gap-3 sm:flex-row"
          style={{ animationDelay: "220ms" }}
        >
          <Button href="#tarifs" size="lg">
            Débutez pour 0,99&nbsp;€ <span aria-hidden>→</span>
          </Button>
          <Button href="#demonstration" variant="outline" size="lg">
            <PlayCircle className="h-5 w-5 text-brand-500" strokeWidth={2} />
            Voir la démo
          </Button>
        </div>

        <ul
          className="mt-8 grid animate-fade-up grid-cols-2 justify-items-center gap-x-4 gap-y-2 sm:flex sm:flex-wrap sm:items-center sm:justify-center sm:gap-x-6 sm:gap-y-2"
          style={{ animationDelay: "260ms" }}
        >
          {TRUST_ITEMS.map((item) => (
            <CheckItem key={item} className="text-body-soft">
              {item}
            </CheckItem>
          ))}
        </ul>
      </div>
    </section>
  );
}
