import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { HOW_IT_WORKS_STEPS } from "@/lib/data/how-it-works";

export function HowItWorks() {
  return (
    <section id="comment-ca-marche" className="py-10 sm:py-12">
      <Container className="flex flex-col gap-8">
        <SectionHeading
          eyebrow="Processus"
          title="Comment ça marche ?"
          description="De la question au marché jusqu'à la décision, en cinq étapes claires."
        />

        {/* Desktop / tablet timeline */}
        <div className="relative hidden lg:block">
          <div className="absolute left-0 right-0 top-9 border-t-2 border-dashed border-brand-200" />
          <div className="relative grid grid-cols-5 gap-6">
            {HOW_IT_WORKS_STEPS.map((step, i) => (
              <div key={step.number} className="flex flex-col items-center text-center">
                <span
                  className="font-display text-5xl font-black text-ink/[0.05] select-none"
                  aria-hidden
                >
                  {step.number}
                </span>
                <div
                  className={
                    "-mt-6 flex h-[72px] w-[72px] items-center justify-center rounded-2xl border-4 border-surface shadow-sm " +
                    (i % 2 === 0
                      ? "bg-brand-500 text-white"
                      : "bg-surface text-brand-500 ring-1 ring-inset ring-brand-200")
                  }
                >
                  <step.icon className="h-7 w-7" strokeWidth={1.75} />
                </div>
                <h3 className="mt-5 font-display text-[15px] font-semibold text-ink">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-body">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile / tablet-below-lg vertical timeline */}
        <div className="flex flex-col gap-8 lg:hidden">
          {HOW_IT_WORKS_STEPS.map((step, i) => (
            <div key={step.number} className="relative flex gap-5">
              <div className="flex flex-col items-center">
                <div
                  className={
                    "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl " +
                    (i % 2 === 0
                      ? "bg-brand-500 text-white"
                      : "bg-surface text-brand-500 ring-1 ring-inset ring-brand-200")
                  }
                >
                  <step.icon className="h-6 w-6" strokeWidth={1.75} />
                </div>
                {i < HOW_IT_WORKS_STEPS.length - 1 && (
                  <span className="mt-2 w-px flex-1 border-l-2 border-dashed border-brand-200" />
                )}
              </div>
              <div className="pb-2">
                <span className="text-xs font-bold text-brand-500">
                  {step.number}
                </span>
                <h3 className="mt-1 font-display text-base font-semibold text-ink">
                  {step.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-body">
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
