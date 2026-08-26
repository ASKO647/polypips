import { HOW_IT_WORKS_STEPS } from "@/lib/data/signal-how-it-works";

/** The 4-step mental model, numbered like the rest of the dashboard's
 * step cards (Fomo/Axiom's old connection tutorial used the same visual
 * language for its steps — kept here, applied to genuinely explanatory
 * content instead). */
export function HowItWorksSteps() {
  return (
    <div className="flex flex-col gap-3">
      {HOW_IT_WORKS_STEPS.map((step, i) => (
        <div key={step.title} className="flex gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] font-display text-sm font-bold text-white/50">
            {String(i + 1).padStart(2, "0")}
          </span>
          <div className="flex-1">
            <p className="font-display text-base font-bold text-white">{step.title}</p>
            <p className="mt-2 text-sm leading-relaxed text-white/60">{step.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
