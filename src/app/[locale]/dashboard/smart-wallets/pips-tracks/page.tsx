import type { Metadata } from "next";
import { PipsTracksComingSoon } from "@/components/dashboard/pips-tracks/pips-tracks-coming-soon";

export const metadata: Metadata = {
  title: "Pips Tracks — Polypips",
};

/** Temporarily blurred (product decision) — the sidebar entry stays, but
 * the page itself no longer fetches or renders real events/summary/token
 * data while the feature is paused. See ComingSoonBlur's file comment for
 * why this is a full route swap rather than wrapping the real
 * PipsTracksFlow in a blur (a CSS blur doesn't hide data from devtools). */
export default function PipsTracksPage() {
  return <PipsTracksComingSoon />;
}
