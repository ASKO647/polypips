import { Check, Star, X } from "lucide-react";
import { Container } from "@/components/ui/container";
import { cn } from "@/lib/utils";
import {
  PRICING_FEATURES,
  PRICING_PLANS,
  type PlanValue,
  type PricingPlan,
} from "@/lib/data/batipilot";

function FeatureValue({ value }: { value: PlanValue }) {
  if (value === false) {
    return (
      <span className="flex items-start gap-2.5 text-white/30">
        <X className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} />
        <span className="text-[13.5px] leading-snug">—</span>
      </span>
    );
  }
  return (
    <span className="flex items-start gap-2.5 text-white/80">
      <Check className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400" strokeWidth={2.5} />
      <span className="text-[13.5px] leading-snug">
        {value === true ? "Inclus" : value}
      </span>
    </span>
  );
}

function PlanCard({ plan }: { plan: PricingPlan }) {
  const key = plan.id;

  const card = (
    <div
      className={cn(
        "relative flex h-full flex-col rounded-3xl border p-8",
        plan.highlighted
          ? "border-transparent bg-[#070b16]"
          : "border-white/10 bg-white/[0.03]"
      )}
    >
      {plan.highlighted && (
        <span className="absolute -top-4 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-[#04060d] shadow-[0_0_24px_rgba(34,211,238,0.5)]">
          <Star className="h-3.5 w-3.5" strokeWidth={2.5} fill="currentColor" />
          Populaire
        </span>
      )}

      <div className="flex flex-col gap-1">
        <h3 className="font-display text-xl font-bold text-white">{plan.name}</h3>
        <p className="text-sm text-white/50">
          {plan.audience} · {plan.positioning}
        </p>
      </div>

      <div className="mt-6 flex items-baseline gap-2">
        <span className="font-display text-4xl font-bold tracking-tight text-white">
          {plan.price}
        </span>
        <span className="text-sm font-medium text-white/50">
          {plan.priceSuffix}
        </span>
      </div>

      <a
        href="#contact"
        className={cn(
          "mt-7 inline-flex h-12 w-full items-center justify-center rounded-full text-sm font-semibold transition-all duration-200 ease-out active:scale-[0.98]",
          plan.highlighted
            ? "bg-gradient-to-r from-cyan-400 to-blue-500 text-[#04060d] shadow-[0_0_28px_rgba(34,211,238,0.4)] hover:-translate-y-0.5 hover:shadow-[0_0_36px_rgba(34,211,238,0.55)]"
            : "border border-white/20 bg-white/[0.04] text-white hover:border-cyan-400/40 hover:bg-white/[0.08]"
        )}
      >
        {plan.cta}
      </a>

      <ul className="mt-8 flex flex-col gap-3.5 border-t border-white/10 pt-7">
        {PRICING_FEATURES.map((row) => (
          <li key={row.label} className="flex flex-col gap-1.5">
            <span className="text-xs font-medium uppercase tracking-wide text-white/40">
              {row.label}
            </span>
            <FeatureValue value={row[key]} />
          </li>
        ))}
      </ul>
    </div>
  );

  if (!plan.highlighted) {
    return <div className="reveal h-full">{card}</div>;
  }

  return (
    <div className="reveal relative h-full lg:-my-6">
      <div className="relative h-full rounded-3xl p-[2px]">
        <div
          aria-hidden
          className="absolute inset-0 animate-spin-slow rounded-3xl opacity-90"
          style={{
            background:
              "conic-gradient(from 0deg, transparent 0%, rgba(34,211,238,0.9) 18%, transparent 36%, transparent 64%, rgba(59,130,246,0.9) 82%, transparent 100%)",
          }}
        />
        <div className="relative h-full rounded-3xl bg-[#070b16]">{card}</div>
      </div>
    </div>
  );
}

export function PricingSection() {
  return (
    <section id="tarifs" className="relative py-20 sm:py-28">
      <Container className="flex flex-col gap-14">
        <div className="reveal mx-auto flex max-w-2xl flex-col items-center gap-4 text-center">
          <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-cyan-400">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
            Tarifs
          </span>
          <h2 className="font-display text-balance text-3xl font-semibold leading-[1.15] tracking-tight text-white sm:text-4xl lg:text-[2.75rem]">
            Une offre adaptée à chaque taille d&apos;entreprise
          </h2>
          <p className="text-balance text-base leading-relaxed text-white/60 sm:text-lg">
            Du premier agent IA assisté jusqu&apos;au pilotage 100 % sur
            mesure de votre activité.
          </p>
        </div>

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3 lg:gap-8">
          {PRICING_PLANS.map((plan) => (
            <PlanCard key={plan.id} plan={plan} />
          ))}
        </div>
      </Container>
    </section>
  );
}
