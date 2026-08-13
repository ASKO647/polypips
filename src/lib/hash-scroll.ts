import type { MouseEvent } from "react";

/**
 * Next.js's App Router only scrolls a same-page `<Link href="#hash">` into
 * view when the target hash differs from the current URL's hash (see
 * `onlyHashChange` in next/dist/client/components/segment-cache/navigation.js).
 * Re-tapping a hash CTA the user has already visited this session is
 * therefore a silent no-op — the exact "sometimes nothing happens" behavior.
 * Intercept only that case and scroll manually; every other click is left
 * to Link's own navigation.
 */
export function scrollToHashIfAlreadyThere(hash: string) {
  return (e: MouseEvent) => {
    if (window.location.hash === `#${hash}`) {
      e.preventDefault();
      document.getElementById(hash)?.scrollIntoView({ block: "start" });
    }
  };
}
