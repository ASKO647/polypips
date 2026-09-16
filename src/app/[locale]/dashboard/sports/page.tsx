import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SportAnalyseIaFlow } from "@/components/dashboard/sports/sport-analyse-ia-flow";
import { createClient } from "@/lib/supabase/server";
import { fetchCreditBalance } from "@/lib/supabase/credits";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Sport");
  return { title: t("metaTitle") };
}

export default async function SportAnalyseIaPage() {
  const supabase = await createClient();
  const creditBalance = await fetchCreditBalance(supabase);
  return <SportAnalyseIaFlow creditBalance={creditBalance} />;
}
