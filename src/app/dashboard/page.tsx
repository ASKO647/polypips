import type { Metadata } from "next";
import { AnalyseIaFlow } from "@/components/dashboard/analyse-ia/analyse-ia-flow";
import { createClient } from "@/lib/supabase/server";
import { fetchRecentAnalyses } from "@/lib/supabase/analyses";

export const metadata: Metadata = {
  title: "Analyse IA — Polypips",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const recentAnalyses = await fetchRecentAnalyses(supabase);

  return <AnalyseIaFlow initialRecentAnalyses={recentAnalyses} />;
}
