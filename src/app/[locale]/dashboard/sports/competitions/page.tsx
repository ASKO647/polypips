import type { Metadata } from "next";
import { SportComingSoon } from "@/components/dashboard/sports/sport-coming-soon";

export const metadata: Metadata = {
  title: "Compétitions — Sports — Polypips",
};

export default function SportsCompetitionsPage() {
  return <SportComingSoon />;
}
