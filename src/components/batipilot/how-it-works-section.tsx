import { Container } from "@/components/ui/container";
import { HOW_IT_WORKS_STEPS } from "@/lib/data/batipilot";

export function HowItWorksSection() {
  return (
    <section id="comment-ca-marche" className="reveal relative py-20 sm:py-28">
      <Container className="flex flex-col gap-14">
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 text-center">
          <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-cyan-400">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
            Processus
          </span>
          <h2 className="font-display text-balance text-3xl font-semibold leading-[1.15] tracking-tight text-white sm:text-4xl lg:text-[2.75rem]">
            Comment ça marche ?
          </h2>
          <p className="text-balance text-base leading-relaxed text-white/60 sm:text-lg">
            De la connexion de vos outils au pilotage complet, en quatre
            étapes.
          </p>
        </div>

        {/* Desktop timeline */}
        <div className="relative hidden lg:block">
          <div
            aria-hidden
            className="absolute left-0 right-0 top-9 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent"
          />
          <div className="relative grid grid-cols-4 gap-6">
            {HOW_IT_WORKS_STEPS.map((step, i) => (
              <div
                key={step.number}
                className="relative flex flex-col items-center text-center"
                style={{ transitionDelay: `${i * 60}ms` }}
              >
                <span
                  className="pointer-events-none absolute -top-8 select-none font-display text-8xl font-black text-white/[0.04]"
                  aria-hidden
                >
                  {step.number}
                </span>
                <div className="relative flex h-[72px] w-[72px] items-center justify-center rounded-full border border-cyan-400/30 bg-cyan-400/[0.06] shadow-[0_0_28px_-6px_rgba(34,211,238,0.4)]">
                  <step.icon className="h-[30px] w-[30px] text-cyan-300" strokeWidth={1.75} />
                </div>
                <h3 className="relative mt-5 font-display text-[20px] font-bold text-white">
                  {step.title}
                </h3>
                <p className="relative mt-2 text-[15px] leading-[1.6] text-white/60">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile vertical timeline */}
        <div className="flex flex-col gap-8 lg:hidden">
          {HOW_IT_WORKS_STEPS.map((step, i) => (
            <div key={step.number} className="relative flex gap-5">
              <div className="flex flex-col items-center">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-cyan-400/30 bg-cyan-400/[0.06]">
                  <step.icon className="h-6 w-6 text-cyan-300" strokeWidth={1.75} />
                </div>
                {i < HOW_IT_WORKS_STEPS.length - 1 && (
                  <span className="mt-2 w-px flex-1 border-l-2 border-dashed border-cyan-400/25" />
                )}
              </div>
              <div className="pb-2">
                <span className="text-xs font-bold text-cyan-400">{step.number}</span>
                <h3 className="mt-1 font-display text-base font-semibold text-white">
                  {step.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-white/60">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
