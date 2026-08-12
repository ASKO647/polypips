"use client";

import { useEffect } from "react";

/**
 * Adds `.is-visible` to any `.reveal` element the first time it enters the
 * viewport, then stops observing it — a one-shot fade/rise-in, not a
 * repeating scroll animation.
 */
export function ScrollRevealObserver() {
  useEffect(() => {
    // The .reveal CSS effect only applies at the lg breakpoint (1024px+);
    // skip setting up the observer entirely below that so mobile hydration
    // doesn't pay for work with no visual effect.
    if (window.innerWidth < 1024) return;

    const elements = document.querySelectorAll<HTMLElement>(".reveal");
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return null;
}
