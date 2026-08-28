import { Trophy } from "lucide-react";
import { ComingSoonBlur } from "@/components/dashboard/coming-soon-blur";

/** Shared across every Sport route (Overview, Matches, Compétitions, a
 * sport's own page, a competition's page, a match's page) while real-data
 * coverage (season/competition gaps under investigation) gets stabilized
 * — see ComingSoonBlur's file comment for why this is a full route swap
 * rather than blurring the real, data-fetching pages. */
export function SportComingSoon() {
  return (
    <ComingSoonBlur
      icon={Trophy}
      title="L'analyse Sport arrive bientôt"
      description="Nous stabilisons la couverture des compétitions et des saisons avant de rouvrir l'univers Sport avec la même fiabilité que Polymarket."
    />
  );
}
