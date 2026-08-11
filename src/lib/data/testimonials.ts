export type VideoTestimonial = {
  id: string;
  handle: string;
  result: string;
  gradient: string;
  /** Set once real UGC footage is available. */
  videoSrc?: string;
};

/**
 * Placeholder video testimonials. Replace `videoSrc` with real UGC clips —
 * layout and card sizing already assume a 9:16 vertical video.
 */
export const VIDEO_TESTIMONIALS: VideoTestimonial[] = [
  {
    id: "t1",
    handle: "@crypto_theo",
    result: "+1 237 € en 3 jours",
    gradient: "from-brand-900 via-brand-700 to-brand-500",
  },
  {
    id: "t2",
    handle: "@trader_max",
    result: "La meilleure façon d'aborder Polymarket",
    gradient: "from-zinc-900 via-brand-800 to-brand-500",
  },
  {
    id: "t3",
    handle: "@sarah_trade",
    result: "+2 890 € en 5 jours",
    gradient: "from-brand-950 via-rose-800 to-brand-400",
  },
  {
    id: "t4",
    handle: "@finance_yanis",
    result: "Copy Trading + limites, enfin serein",
    gradient: "from-zinc-900 via-zinc-700 to-brand-600",
  },
  {
    id: "t5",
    handle: "@lucas_invest",
    result: "+4 120 € en 1 semaine",
    gradient: "from-brand-900 via-brand-600 to-orange-400",
  },
];
