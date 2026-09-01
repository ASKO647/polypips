import { Check } from "lucide-react";
import { Container } from "@/components/ui/container";
import { AUTOMATION_BLOCKS } from "@/lib/data/batipilot";

export function AutomationSection() {
  return (
    <section id="automatisation" className="reveal relative py-20 sm:py-28">
      <Container className="flex flex-col gap-12">
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 text-center">
          <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-cyan-400">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
            Visibilité
          </span>
          <h2 className="font-display text-balance text-3xl font-semibold leading-[1.15] tracking-tight text-white sm:text-4xl lg:text-[2.75rem]">
            Automatisation marketing &amp; visibilité
          </h2>
          <p className="text-balance text-base leading-relaxed text-white/60 sm:text-lg">
            Votre présence en ligne tourne seule, pendant que vous gérez vos
            chantiers.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {AUTOMATION_BLOCKS.map((block) => (
            <div
              key={block.title}
              className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-white/[0.015] p-8 sm:p-10"
            >
              <div
                aria-hidden
                className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 animate-float-slow rounded-full bg-cyan-400/10 blur-3xl"
              />
              <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 text-[#04060d] shadow-[0_0_30px_rgba(34,211,238,0.35)]">
                <block.icon className="h-7 w-7" strokeWidth={1.75} />
              </span>
              <h3 className="relative mt-6 font-display text-xl font-semibold text-white sm:text-2xl">
                {block.title}
              </h3>
              <p className="relative mt-3 text-[15px] leading-relaxed text-white/60">
                {block.description}
              </p>
              <ul className="relative mt-6 flex flex-col gap-3">
                {block.bullets.map((bullet) => (
                  <li key={bullet} className="flex items-start gap-2.5 text-sm text-white/75">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400" strokeWidth={2.5} />
                    {bullet}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
