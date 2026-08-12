export type VideoTestimonial = {
  id: string;
  handle: string;
  result: string;
  duration: string;
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
    result: "+1 237 €",
    duration: "0:42",
    gradient: "from-[#5f0d1c] via-[#ab0f27] to-[#ef2a3d]",
  },
  {
    id: "t2",
    handle: "@trader_max",
    result: "Le meilleur outil",
    duration: "1:05",
    gradient: "from-zinc-900 via-[#820e21] to-[#ef2a3d]",
  },
  {
    id: "t3",
    handle: "@sarah_trade",
    result: "+2 890 €",
    duration: "0:38",
    gradient: "from-[#38070f] via-rose-800 to-[#fb6b75]",
  },
  {
    id: "t4",
    handle: "@finance_yanis",
    result: "Enfin serein",
    duration: "0:51",
    gradient: "from-zinc-900 via-zinc-700 to-[#d21630]",
  },
  {
    id: "t5",
    handle: "@lucas_invest",
    result: "+4 120 €",
    duration: "1:12",
    gradient: "from-[#5f0d1c] via-[#d21630] to-orange-400",
  },
];
