function ArcRings({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 400"
      className={className}
      fill="none"
      aria-hidden="true"
    >
      {[60, 100, 140, 180, 220, 260].map((r) => (
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
      {/* Central radial red → white gradient */}
      <div
        className="absolute left-1/2 top-[-14rem] h-[40rem] w-[70rem] -translate-x-1/2 rounded-full opacity-80 blur-3xl"
        style={{
          background:
            "radial-gradient(ellipse at center, var(--color-brand-100) 0%, var(--color-surface-rose) 45%, transparent 72%)",
        }}
      />

      {/* Large diffuse side halos */}
      <div
        className="absolute -left-40 top-16 h-[28rem] w-[28rem] rounded-full opacity-60 blur-[100px]"
        style={{ background: "var(--color-brand-200)" }}
      />
      <div
        className="absolute -right-40 top-16 h-[28rem] w-[28rem] rounded-full opacity-60 blur-[100px]"
        style={{ background: "var(--color-brand-200)" }}
      />

      {/* Fine wave rings */}
      <ArcRings className="absolute left-0 top-1/2 h-[28rem] w-[28rem] -translate-y-1/2 text-brand-300/50 sm:h-[32rem] sm:w-[32rem]" />
      <ArcRings className="absolute right-0 top-1/2 h-[28rem] w-[28rem] -translate-y-1/2 rotate-180 text-brand-300/50 sm:h-[32rem] sm:w-[32rem]" />

      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-page-bg" />
    </div>
  );
}
