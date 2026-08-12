import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { FEATURES } from "@/lib/data/features";

export function FeatureSection() {
  return (
    <section id="fonctionnalites" className="reveal py-10 sm:py-12">
      <Container className="flex flex-col gap-8">
        <SectionHeading
          eyebrow="Fonctionnalités"
          title="Tout ce dont vous avez besoin pour prendre l'avantage"
          description="Une plateforme complète pour analyser, suivre et décider — sans jongler entre dix outils."
        />

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <article
              key={feature.id}
              className="flex min-h-[188px] flex-col rounded-[24px] border border-border bg-surface p-7 transition-all duration-200 ease-out hover:-translate-y-1 hover:border-brand-200 hover:shadow-[0_16px_32px_-16px_rgba(18,5,7,0.12)]"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-500">
                <feature.icon className="h-5 w-5" strokeWidth={2} />
              </div>
              <h3 className="mt-5 font-display text-[22px] font-bold text-ink">
                {feature.title}
              </h3>
              <p className="mt-2 text-base leading-[1.6] text-body">
                {feature.description}
              </p>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
