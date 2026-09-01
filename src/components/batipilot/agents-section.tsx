import { Container } from "@/components/ui/container";
import { AGENTS } from "@/lib/data/batipilot";

export function AgentsSection() {
  return (
    <section id="agents" className="reveal relative py-20 sm:py-28">
      <Container className="flex flex-col gap-12">
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 text-center">
          <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-cyan-400">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
            Agents IA
          </span>
          <h2 className="font-display text-balance text-3xl font-semibold leading-[1.15] tracking-tight text-white sm:text-4xl lg:text-[2.75rem]">
            5 agents qui travaillent pour votre entreprise
          </h2>
          <p className="text-balance text-base leading-relaxed text-white/60 sm:text-lg">
            Chaque agent prend en charge une mission critique, en continu,
            pour libérer du temps à vos équipes sur le terrain.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {AGENTS.map((agent, i) => (
            <div
              key={agent.title}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-[1.02] hover:border-cyan-400/40 hover:bg-white/[0.05] hover:shadow-[0_0_40px_-8px_rgba(34,211,238,0.45)]"
              style={{ transitionDelay: `${i * 40}ms` }}
            >
              <div
                aria-hidden
                className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-cyan-400/0 blur-2xl transition-colors duration-300 group-hover:bg-cyan-400/20"
              />
              <span className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400/20 to-blue-500/20 text-cyan-300 ring-1 ring-inset ring-cyan-400/30 transition-colors duration-300 group-hover:from-cyan-400 group-hover:to-blue-500 group-hover:text-[#04060d]">
                <agent.icon className="h-6 w-6" strokeWidth={1.75} />
              </span>
              <h3 className="relative mt-5 font-display text-lg font-semibold text-white">
                {agent.title}
              </h3>
              <p className="relative mt-2 text-[15px] leading-[1.6] text-white/60">
                {agent.description}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
