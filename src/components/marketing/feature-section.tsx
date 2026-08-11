import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { FEATURES } from "@/lib/data/features";

export function FeatureSection() {
  return (
    <section id="fonctionnalites" className="py-24 sm:py-28">
      <Container className="flex flex-col gap-12">
        <SectionHeading
          eyebrow="Fonctionnalités"
          title="Tout ce dont vous avez besoin pour prendre l'avantage"
          description="Une plateforme complète pour analyser, suivre et décider — sans jongler entre dix outils."
        />

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-6">
          {FEATURES.map((feature) => (
            <article
              key={feature.id}
              className="flex flex-col rounded-2xl border border-border bg-surface p-6 transition-colors hover:border-brand-200"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <feature.icon className="h-5 w-5" strokeWidth={2} />
              </div>
              <h3 className="mt-5 font-display text-base font-semibold text-ink">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-body">
                {feature.description}
              </p>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
