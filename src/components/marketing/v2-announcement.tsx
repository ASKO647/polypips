import { Container } from "@/components/ui/container";
import { Button, ButtonIcon } from "@/components/ui/button";
import { CheckItem } from "@/components/ui/check-item";
import { V2Badge } from "@/components/marketing/v2-badge";

/** Sales-facing rewrite of what actually shipped recently, not an internal
 * changelog copy-paste — a first-time visitor reading this has never heard
 * of "Smart Money" or "Fomo X Axiom" yet, so each line leads with the
 * concrete win rather than the feature's internal name. */
const V2_HIGHLIGHTS = [
  "Analyse IA sur 7 sports — foot, basket, tennis, rugby, baseball, boxe, MMA",
  "Smart Money basé sur le vrai classement mensuel des meilleurs traders",
  "Copy Trading validé par l'IA avant chaque suggestion",
  "Wallets crypto Fomo & Axiom suivis en temps réel",
  "Coach IA qui connaît tout l'historique de vos analyses",
  "Compétitions classées par pays, avec les vrais logos",
];

/**
 * Sits right before Pricing (id="tarifs"), not right after the Hero: every
 * line here names a specific feature (Smart Money, Copy Trading, Fomo X
 * Axiom, Coach IA) that only means something once FeatureSection/HowItWorks/
 * ProductDemo have already explained the product below — a first-time
 * visitor hitting this straight after the headline would read a list of
 * unexplained jargon. Placed here instead, it works as a value-stack right
 * before the purchase decision: "look how much is already included, and we
 * just added more" is exactly the reminder that belongs immediately before
 * pricing, not before the visitor even knows what Polypips does.
 */
export function V2Announcement() {
  return (
    <section className="reveal py-10 sm:py-12">
      <Container>
        <div className="relative overflow-hidden rounded-[32px] border border-brand-100 bg-gradient-to-br from-[#FFF7F7] via-white to-[#FFF1F1] px-6 py-12 sm:px-10 lg:px-16 lg:py-16">
          <div className="flex flex-col items-center gap-4 text-center">
            <V2Badge />

            <h2 className="text-balance font-display text-3xl font-bold leading-[1.15] tracking-tight text-ink sm:text-4xl lg:text-[2.75rem]">
              La V2.0 est maintenant disponible 🎉
            </h2>

            <p className="max-w-2xl text-balance text-base leading-relaxed text-body sm:text-lg">
              Le plus gros lancement depuis les débuts de Polypips&nbsp;: plus
              de sports, de vrais wallets crypto à suivre, une IA encore plus
              affûtée. Tout est déjà actif sur votre compte.
            </p>
          </div>

          <ul className="mx-auto mt-10 grid max-w-3xl grid-cols-1 gap-x-10 gap-y-4 sm:grid-cols-2">
            {V2_HIGHLIGHTS.map((item) => (
              <CheckItem key={item} className="items-start text-[15px] sm:text-base">
                {item}
              </CheckItem>
            ))}
          </ul>

          <div className="mt-10 flex justify-center">
            <Button href="/signup" size="lg">
              Essayer la V2.0 <ButtonIcon>→</ButtonIcon>
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
