import { ArrowRight } from "lucide-react";
import { HeroBackground } from "@/components/batipilot/hero-background";

export function BatipilotHero() {
  return (
    <section id="hero" className="relative isolate overflow-hidden">
      <HeroBackground />

      <div className="relative mx-auto flex w-full max-w-[860px] flex-col items-center px-6 pb-20 pt-20 text-center sm:pb-28 sm:pt-28 lg:pb-32 lg:pt-32">
        <span
          className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/[0.07] px-4 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-cyan-300"
          style={{ animationDelay: "0ms" }}
        >
          <span className="h-1.5 w-1.5 animate-glow-pulse rounded-full bg-cyan-400" />
          Agents IA pour le BTP
        </span>

        <h1
          className="mt-8 animate-fade-up text-balance font-display text-[2.5rem] font-extrabold leading-[0.98] tracking-tight text-white sm:text-6xl lg:text-[68px]"
          style={{ animationDelay: "80ms" }}
        >
          L&apos;IA qui pilote{" "}
          <span className="bg-gradient-to-r from-cyan-300 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
            votre entreprise BTP
          </span>
        </h1>

        <p
          className="mt-6 max-w-[600px] animate-fade-up text-balance text-[18px] leading-[1.65] text-white/65"
          style={{ animationDelay: "140ms" }}
        >
          BatiPilot centralise vos chantiers et automatise votre gestion
          commerciale et administrative : standard, dossiers d&apos;aides,
          relances, appels d&apos;offres et rendez-vous, pilotés par des
          agents IA qui travaillent pour vous 24h/24.
        </p>

        <div
          className="mt-10 flex animate-fade-up flex-col items-center gap-3 sm:flex-row"
          style={{ animationDelay: "220ms" }}
        >
          <a
            href="#tarifs"
            className="group inline-flex h-14 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 px-7 text-base font-semibold text-[#04060d] shadow-[0_0_32px_rgba(34,211,238,0.4)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_0_44px_rgba(34,211,238,0.55)] active:translate-y-0"
          >
            Découvrir les offres
            <ArrowRight
              className="h-5 w-5 transition-transform duration-200 ease-out group-hover:translate-x-1"
              strokeWidth={2.25}
            />
          </a>
          <a
            href="#agents"
            className="inline-flex h-14 items-center justify-center rounded-full border border-white/20 bg-white/[0.03] px-7 text-base font-semibold text-white transition-all duration-200 ease-out hover:scale-[1.02] hover:border-cyan-400/40 hover:bg-white/[0.06] active:scale-[0.98]"
          >
            Voir les agents IA
          </a>
        </div>
      </div>
    </section>
  );
}
