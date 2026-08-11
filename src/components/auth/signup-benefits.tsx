import { SIGNUP_BENEFITS } from "@/lib/data/signup";

export function SignupBenefits() {
  return (
    <ul className="flex flex-col gap-5">
      {SIGNUP_BENEFITS.map((benefit) => (
        <li key={benefit.title} className="flex items-start gap-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            <benefit.icon className="h-5 w-5" strokeWidth={2} />
          </span>
          <div>
            <p className="text-[15px] font-semibold text-ink">
              {benefit.title}
            </p>
            <p className="mt-0.5 text-sm leading-relaxed text-body">
              {benefit.description}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
