import { ArrowUpRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { FEATURES } from "@/lib/data/features";

function MetricChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-xl border border-border bg-surface px-3.5 py-2.5 shadow-sm">
      <span className="text-[11px] font-medium uppercase tracking-wide text-body-soft">
        {label}
      </span>
      <span className="font-display text-lg font-bold text-brand-600">
        {value}
      </span>
    </div>
  );
}

export function FeatureSection() {
  const [big, secondary, ...rest] = FEATURES;
  const row = rest.slice(0, 3);
  const banner = rest[3];

  return (
    <section id="fonctionnalites" className="py-24 sm:py-28">
      <Container className="flex flex-col gap-12">
        <SectionHeading
          eyebrow="Fonctionnalités"
          title="Tout ce dont vous avez besoin pour prendre l'avantage"
          description="Une plateforme complète pour analyser, suivre et décider — sans jongler entre dix outils."
        />

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <article className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-surface-muted to-surface p-8 sm:col-span-2 sm:row-span-1">
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500 text-white shadow-[0_10px_24px_-8px_var(--color-brand-500)]">
                <big.icon className="h-6 w-6" strokeWidth={2} />
              </div>
              <h3 className="mt-6 font-display text-2xl font-semibold text-ink">
                {big.title}
              </h3>
              <p className="mt-2.5 max-w-md text-[15px] leading-relaxed text-body">
                {big.description}
              </p>
            </div>
            {big.metric && (
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-ink px-3.5 py-1.5 text-xs font-bold text-white">
                  YES
                </span>
                <MetricChip label="Probabilité IA" value="68%" />
                <MetricChip label={big.metric.label} value={big.metric.value} />
              </div>
            )}
            <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-brand-200/40 blur-3xl transition-opacity group-hover:opacity-80" />
          </article>

          <article className="flex flex-col rounded-3xl border border-border bg-surface p-7 transition-colors hover:border-brand-200">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <secondary.icon className="h-5 w-5" strokeWidth={2} />
            </div>
            <h3 className="mt-5 font-display text-lg font-semibold text-ink">
              {secondary.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-body">
              {secondary.description}
            </p>
            <span className="mt-auto flex items-center gap-1 pt-5 text-sm font-semibold text-brand-600">
              En savoir plus
              <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2.5} />
            </span>
          </article>

          {row.map((feature) => (
            <article
              key={feature.id}
              className="flex flex-col rounded-3xl border border-border bg-surface p-7 transition-colors hover:border-brand-200"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <feature.icon className="h-5 w-5" strokeWidth={2} />
              </div>
              <h3 className="mt-5 font-display text-lg font-semibold text-ink">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-body">
                {feature.description}
              </p>
              {feature.metric && (
                <span className="mt-4 inline-flex w-fit items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-600">
                  {feature.metric.label}: {feature.metric.value}
                </span>
              )}
            </article>
          ))}

          {banner && (
            <article className="flex flex-col items-start gap-6 rounded-3xl border border-border bg-ink p-8 sm:col-span-2 lg:col-span-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-brand-400">
                  <banner.icon className="h-5 w-5" strokeWidth={2} />
                </div>
                <div>
                  <h3 className="font-display text-lg font-semibold text-white">
                    {banner.title}
                  </h3>
                  <p className="mt-1.5 max-w-md text-sm leading-relaxed text-white/60">
                    {banner.description}
                  </p>
                </div>
              </div>
              <div className="flex items-end gap-1.5">
                {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                  <span
                    key={i}
                    className="w-2.5 rounded-full bg-gradient-to-t from-brand-700 to-brand-400"
                    style={{ height: `${h * 0.6}px` }}
                  />
                ))}
              </div>
            </article>
          )}
        </div>
      </Container>
    </section>
  );
}
