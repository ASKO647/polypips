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
      left: direction * 296,
      behavior: "smooth",
    });
  };

  return (
    <section className="py-10 sm:py-12">
      <Container className="flex flex-col gap-8">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <SectionHeading
            align="left"
            eyebrow="Témoignages"
            title="Ils parlent de leurs résultats avec Polypips"
            description="Découvrez les retours de nos utilisateurs."
            className="max-w-xl"
          />
          <div className="hidden shrink-0 items-center gap-2 sm:flex">
            <button
              type="button"
              onClick={() => scrollBy(-1)}
              aria-label="Précédent"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border-strong text-ink transition-all duration-150 ease-out hover:scale-105 hover:border-brand-300 hover:bg-brand-50 active:scale-95"
            >
              <ChevronLeft className="h-4.5 w-4.5" />
            </button>
            <button
              type="button"
              onClick={() => scrollBy(1)}
              aria-label="Suivant"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border-strong text-ink transition-all duration-150 ease-out hover:scale-105 hover:border-brand-300 hover:bg-brand-50 active:scale-95"
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
              className="group relative aspect-[9/16] w-[210px] shrink-0 snap-start overflow-hidden rounded-3xl border border-border shadow-sm sm:w-[240px]"
            >
              <div
                className={cn(
                  "absolute inset-0 bg-gradient-to-br",
                  t.gradient
                )}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-black/20" />

              <button
                type="button"
                aria-label={`Lire le témoignage de ${t.handle}`}
                className="absolute left-1/2 top-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-brand-600 shadow-lg transition-transform duration-200 group-hover:scale-110"
              >
                <Play className="ml-0.5 h-5 w-5 fill-current" />
              </button>

              <div className="absolute inset-x-0 bottom-0 p-4">
                <p className="text-sm font-bold text-white">{t.result}</p>
                <p className="mt-1 text-xs font-medium text-white/70">
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
