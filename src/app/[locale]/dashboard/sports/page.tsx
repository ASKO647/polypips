import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SportAnalyseIaFlow } from "@/components/dashboard/sports/sport-analyse-ia-flow";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Sport");
  return { title: t("metaTitle") };
}

export default function SportAnalyseIaPage() {
  return <SportAnalyseIaFlow />;
}
