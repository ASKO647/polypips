import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { HOW_IT_WORKS_STEPS } from "@/lib/data/how-it-works";

export function HowItWorks() {
  const t = useTranslations("HowItWorks");

  return (
    <section id="comment-ca-marche" className="reveal py-10 sm:py-12">
      <Container className="flex flex-col gap-12">
        <SectionHeading
          eyebrow={t("eyebrow")}
          title={t("title")}
          description={t("description")}
        />

        {/* Desktop / tablet timeline */}
        <div className="relative hidden lg:block">
          <svg
            viewBox="0 0 1000 100"
            preserveAspectRatio="none"
            className="absolute left-0 right-0 top-9 h-[60px] w-full text-brand-200"
            aria-hidden="true"
          >
            <path
              d="M0,50 C 100,15 150,15 250,50 C 350,85 400,85 500,50 C 600,15 650,15 750,50 C 850,85 900,85 1000,50"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray="2 8"
              strokeLinecap="round"
            />
          </svg>

          <div className="relative grid grid-cols-5 gap-6">
            {HOW_IT_WORKS_STEPS.map((step) => (
              <div
                key={step.number}
                className="relative flex flex-col items-center text-center"
              >
                <span
                  className="pointer-events-none absolute -top-8 select-none font-display text-8xl font-black text-ink/[0.045]"
                  aria-hidden
                >
                  {step.number}
                </span>
                <div className="relative flex h-[72px] w-[72px] items-center justify-center rounded-full border border-[#F3C7C7] bg-brand-50">
                  <step.icon
                    className="h-[30px] w-[30px] text-brand-500"
                    strokeWidth={1.75}
                  />
                </div>
                <h3 className="relative mt-5 font-display text-[20px] font-bold text-ink">
                  {t(`steps.${step.id}.title`)}
                </h3>
                <p className="relative mt-2 text-[15px] leading-[1.6] text-body">
                  {t(`steps.${step.id}.description`)}
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
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-[#F3C7C7] bg-brand-50">
                  <step.icon className="h-6 w-6 text-brand-500" strokeWidth={1.75} />
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
                  {t(`steps.${step.id}.title`)}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-body">
                  {t(`steps.${step.id}.description`)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
