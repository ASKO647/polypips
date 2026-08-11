export function AuthBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div
        className="absolute -left-24 -top-32 h-[28rem] w-[28rem] rounded-full opacity-80 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, var(--color-brand-100) 0%, var(--color-surface-rose) 55%, transparent 75%)",
        }}
      />
      <div
        className="absolute -right-24 -top-20 h-[26rem] w-[26rem] rounded-full opacity-70 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, var(--color-brand-100) 0%, var(--color-surface-rose) 55%, transparent 75%)",
        }}
      />
      <div className="absolute inset-x-0 top-0 h-[34rem] bg-gradient-to-b from-transparent to-surface" />
    </div>
  );
}
