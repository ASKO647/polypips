import type { ComponentType } from "react";

export function PlaceholderSection({
  icon: Icon,
  title,
  description,
}: {
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-16 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-brand-400">
        <Icon className="h-6 w-6" strokeWidth={1.75} />
      </span>
      <h1 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
        {title}
      </h1>
      <p className="max-w-md text-balance text-sm leading-relaxed text-white/50 sm:text-base">
        {description}
      </p>
      <span className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-brand-500/15 px-3 py-1.5 text-xs font-semibold text-brand-400">
        Cette section arrive bientôt
      </span>
    </div>
  );
}
