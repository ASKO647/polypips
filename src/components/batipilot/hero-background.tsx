/**
 * Pure CSS "circuit grid" backdrop — animated pan on the grid lines plus two
 * drifting gradient blobs. No canvas / particle library: keeps the hero
 * lightweight on mobile while still reading as an animated mesh.
 */
export function HeroBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden bg-[#04060d]">
      <div
        className="absolute inset-0 animate-grid-pan opacity-[0.35]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(56,189,248,0.16) 1px, transparent 1px), linear-gradient(to bottom, rgba(56,189,248,0.16) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />

      <div
        className="absolute left-1/2 top-[-16rem] h-[42rem] w-[52rem] -translate-x-1/2 animate-mesh-drift rounded-full opacity-70 blur-[110px]"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(34,211,238,0.35) 0%, rgba(59,130,246,0.18) 45%, transparent 72%)",
        }}
      />
      <div
        className="absolute -left-32 bottom-[-10rem] h-[26rem] w-[26rem] animate-mesh-drift rounded-full opacity-50 blur-[100px]"
        style={{
          background: "rgba(59,130,246,0.3)",
          animationDelay: "-6s",
        }}
      />
      <div
        className="absolute -right-32 top-1/3 h-[24rem] w-[24rem] animate-mesh-drift rounded-full opacity-40 blur-[100px]"
        style={{
          background: "rgba(34,211,238,0.28)",
          animationDelay: "-11s",
        }}
      />

      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,#04060d_88%)]" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-[#04060d]" />
    </div>
  );
}
