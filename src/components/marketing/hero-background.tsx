function ArcRings({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 400"
      className={className}
      fill="none"
      aria-hidden="true"
    >
      {[60, 100, 140, 180, 220].map((r) => (
        <circle
          key={r}
          cx="0"
          cy="200"
          r={r}
          stroke="currentColor"
          strokeWidth="1"
        />
      ))}
    </svg>
  );
}

export function HeroBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute left-1/2 top-[-12rem] h-[36rem] w-[64rem] -translate-x-1/2 rounded-full opacity-70 blur-3xl"
        style={{
          background:
            "radial-gradient(ellipse at center, var(--color-brand-100) 0%, var(--color-surface-rose) 45%, transparent 72%)",
        }}
      />
      <ArcRings className="absolute left-0 top-1/2 h-[26rem] w-[26rem] -translate-y-1/2 text-brand-200/60 sm:h-[30rem] sm:w-[30rem]" />
      <ArcRings className="absolute right-0 top-1/2 h-[26rem] w-[26rem] -translate-y-1/2 rotate-180 text-brand-200/60 sm:h-[30rem] sm:w-[30rem]" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-surface" />
    </div>
  );
}
