import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SportAnalysesHistory } from "@/components/dashboard/sports/sport-analyses-history";
import { createClient } from "@/lib/supabase/server";
import { fetchRecentSportAnalyses } from "@/lib/supabase/sports-analyses";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Sport.History");
  return { title: t("metaTitle") };
}

export default async function SportMesAnalysesPage() {
  const supabase = await createClient();
  const analyses = await fetchRecentSportAnalyses(supabase, 50);
  return <SportAnalysesHistory analyses={analyses} />;
}
