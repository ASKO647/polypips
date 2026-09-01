import type { Metadata } from "next";
import { SportAnalyseIaFlow } from "@/components/dashboard/sports/sport-analyse-ia-flow";

export const metadata: Metadata = {
  title: "Sport — Analyse IA — Polypips",
};

export default function SportAnalyseIaPage() {
  return <SportAnalyseIaFlow />;
}
