"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { VIDEO_TESTIMONIALS } from "@/lib/data/testimonials";
import { cn } from "@/lib/utils";

export function VideoTestimonials() {
  const scrollerRef = useRef<HTMLDivElement>(null);

  const scrollBy = (direction: -1 | 1) => {
    scrollerRef.current?.scrollBy({
      left: direction * 240,
      behavior: "smooth",
    });
  };

  return (
    <section className="reveal py-10 sm:py-12">
      <Container className="flex flex-col gap-8">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <SectionHeading
            align="left"
            eyebrow="Témoignages"
            title="Ils parlent de leurs résultats avec Polypips"
            description="Découvrez les retours de nos utilisateurs."
            className="max-w-xl"
          />
          <div className="hidden shrink-0 items-center gap-2.5 sm:flex">
            <button
              type="button"
              onClick={() => scrollBy(-1)}
              aria-label="Précédent"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-ink shadow-[0_8px_20px_-6px_rgba(18,5,7,0.18)] transition-all duration-150 ease-out hover:scale-105 active:scale-95"
            >
              <ChevronLeft className="h-4.5 w-4.5" />
            </button>
            <button
              type="button"
              onClick={() => scrollBy(1)}
              aria-label="Suivant"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-ink shadow-[0_8px_20px_-6px_rgba(18,5,7,0.18)] transition-all duration-150 ease-out hover:scale-105 active:scale-95"
            >
              <ChevronRight className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>

        <div
          ref={scrollerRef}
          className="-mx-6 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth px-6 pb-4 [scrollbar-width:none] lg:-mx-8 lg:px-8 [&::-webkit-scrollbar]:hidden"
        >
          {VIDEO_TESTIMONIALS.map((t) => (
            <article
              key={t.id}
              className="group relative h-[392px] w-[220px] shrink-0 snap-start overflow-hidden rounded-[28px] shadow-[0_12px_28px_-14px_rgba(18,5,7,0.3)] transition-transform duration-200 ease-out hover:-translate-y-1"
            >
              <div
                className={cn(
                  "absolute inset-0 bg-gradient-to-br",
                  t.gradient
                )}
              />
              <div className="absolute inset-x-0 bottom-0 h-[120px] bg-gradient-to-t from-black/85 to-transparent" />

              <button
                type="button"
                aria-label={`Lire le témoignage de ${t.handle}`}
                className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-lg transition-transform duration-200 group-hover:scale-110"
              >
                <Play className="ml-0.5 h-6 w-6 fill-brand-500 text-brand-500" />
              </button>

              <span className="absolute right-3.5 top-3.5 rounded-md bg-black/40 px-1.5 py-0.5 text-[15px] font-medium text-white backdrop-blur-sm">
                {t.duration}
              </span>

              <div className="absolute inset-x-0 bottom-0 p-4">
                <p className="text-[28px] font-bold leading-[1.05] text-white">
                  {t.result}
                </p>
                <p className="mt-1.5 text-[14px] font-medium text-white/70">
                  {t.handle}
                </p>
              </div>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
