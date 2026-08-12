import type { Metadata } from "next";
import { AnalyseIaFlow } from "@/components/dashboard/analyse-ia/analyse-ia-flow";

export const metadata: Metadata = {
  title: "Analyse IA — Polypips",
};

export default function DashboardPage() {
  return <AnalyseIaFlow />;
}
